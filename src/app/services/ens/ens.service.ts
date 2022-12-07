import { Injectable, Provider } from '@angular/core';
import request, { gql } from 'graphql-request';
import { Observable } from 'rxjs';
import { ens_normalize, ens_beautify } from '@adraffy/ens-normalize';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  DomainFiltersModel,
  DomainMetadataModel,
  DomainTypeEnum,
} from 'src/app/models/domains';
import { invalidChars } from 'src/app/configurations';
import { MiscUtilsService } from '../misc-utils';
import { CategoryModel } from 'src/app/models/category';
import { ethers } from 'ethers';
import contentHash from '@ensdomains/content-hash';

const REGISTER_GAS = 175000;
const REGISTER_CONFIG_GAS = 300000;
const COMMIT_GAS = 25000;
const COMMIT_SINGLE_GAS = 55000;
const RENEW_GAS = 150000;
const PREPUNK_TIME = 1498176000;
const PREPUNK_BLOCK = 15010210;
const THREE_MONTHS_IN_SECONDS_GRACE = 7776000;
const TWENTY_ONE_DAYS_IN_SECONDS_PREMIUM = 1814400;
const THREE_MONTHS_IN_MILISECONDS_GRACE = 7776000000;
const TWENTY_ONE_DAYS_IN_MILISECONDS_PREMIUM = 1814400000;

@Injectable({
  providedIn: 'root',
})
export class EnsService {
  constructor(
    private http: HttpClient,
    protected miscUtils: MiscUtilsService
  ) {}

  getDomainMetadata(domainHash: string) {
    const url = environment.networks[environment.defaultChain].ensMetadataAPI;
    return this.http.get(url + domainHash);
  }

  getDomainContentHash(provider: Provider, ethName: string) {
    return new Observable((observer) => {
      (provider as any)
        .getResolver(ethName)
        .then((resolver) => {
          return resolver.getContentHash();
        })
        .then((r) => {
          let web2Link = 'https://';
          if (r.indexOf('ipfs:') > -1) {
            web2Link += 'ipfs.io/ipfs/' + r.replace('ipfs://', '');
          } else if (r.indexOf('ipns:') > -1) {
            web2Link += 'gateway.ipfs.io/ipns/' + r.replace('ipns://', '');
          }
          observer.next(web2Link);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getDomainContentHashPure(provider: Provider, ethName: string) {
    return new Observable((observer) => {
      (provider as any)
        .getResolver(ethName)
        .then((resolver) => {
          return resolver.getContentHash();
        })
        .then((r) => {
          let web2Link;
          if (r.indexOf('ipfs:') > -1) {
            web2Link = r.replace('ipfs://', '');
          } else if (r.indexOf('ipns:') > -1) {
            web2Link = r.replace('ipns://', '');
          } else if (r.indexOf('arweave:') > -1) {
            web2Link = r;
          }
          observer.next(web2Link);
          observer.complete();
        })
        .catch((e) => {
          if (
            JSON.stringify(e).indexOf(
              'invalid or unsupported content hash data'
            ) > -1
          ) {
            observer.next(e.data);
            observer.complete();
            return;
          }
          observer.next(false);
          observer.complete();
        });
    });
  }

  matchProtocol(text) {
    return (
      text.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave):\/\/(.*)/) ||
      text.match(/\/(ipfs)\/(.*)/) ||
      text.match(/\/(ipns)\/(.*)/)
    );
  }

  encodeContenthash(text) {
    let content, contentType;
    let encoded: any = false;
    let error;
    if (!!text) {
      let matched = this.matchProtocol(text);
      if (matched) {
        contentType = matched[1];
        content = matched[2];
      }
      try {
        if (contentType === 'ipfs') {
          if (content.length >= 4) {
            encoded = '0x' + contentHash.encode('ipfs-ns', content);
          }
        } else if (contentType === 'ipns') {
          encoded = '0x' + contentHash.encode('ipns-ns', content);
        } else if (contentType === 'bzz') {
          if (content.length >= 4) {
            encoded = '0x' + contentHash.fromSwarm(content);
          }
        } else if (contentType === 'onion') {
          if (content.length == 16) {
            encoded = '0x' + contentHash.encode('onion', content);
          }
        } else if (contentType === 'onion3') {
          if (content.length == 56) {
            encoded = '0x' + contentHash.encode('onion3', content);
          }
        } else if (contentType === 'sia') {
          if (content.length == 46) {
            encoded = '0x' + contentHash.encode('skynet-ns', content);
          }
        } else if (contentType === 'arweave') {
          if (content.length == 43) {
            encoded = '0x' + contentHash.encode('arweave-ns', content);
          }
        } else {
          console.warn('Unsupported protocol or invalid value', {
            contentType,
            text,
          });
        }
      } catch (err) {
        const errorMessage = 'Error encoding content hash';
        error = errorMessage;
      }
    }
    return { encoded, error };
  }

  findDomains(
    domains: string[],
    prepunk = false,
    expirationDate = '4102444800',
    registrationDate = '1262300400'
  ) {
    if ((expirationDate as any) === 'NaN') {
      expirationDate = '4102444800';
    }
    if ((registrationDate as any) === 'NaN') {
      registrationDate = '1262300400';
    }
    const url = environment.networks[environment.defaultChain].ensGraphQLAPI;
    return new Observable((observer) => {
      const query = gql`
        query (
          $domainNames: [String!]
          $expirationDate: BigInt,
          $registrationDate: BigInt,
          $prePunkBlock: Int
        ) {
          registrations(
            first: 1000
            where: {
              labelName_in: $domainNames,
              registrationDate_gte: $registrationDate,
              expiryDate_lte: $expirationDate ${
                prepunk === true
                  ? ', events_: { blockNumber_lte: $prePunkBlock }'
                  : ''
              }
            }
          ) {
            id
            labelName
            expiryDate
            registrationDate
            domain {
              id
              createdAt
              labelName
              labelhash
              events {
                id
                blockNumber
                transactionID
              }
            }
          }
        }
      `;
      request(url, query, {
        domainNames: domains,
        prePunkBlock: PREPUNK_BLOCK,
        registrationDate,
        expirationDate,
      }).then((data) => {
        observer.next(data);
        observer.complete();
      });
    });
  }

  getDomain(domain: string) {
    const url = environment.networks[environment.defaultChain].ensGraphQLAPI;
    return new Observable((observer) => {
      const query = gql`
        query ($domainName: String!) {
          registrations(first: 1, where: { labelName: $domainName }) {
            id
            labelName
            expiryDate
            registrationDate
            registrant {
              id
            }
            domain {
              id
              createdAt
              labelhash
            }
            events {
              blockNumber
              transactionID
            }
          }
        }
      `;
      request(url, query, { domainName: domain }).then((data) => {
        observer.next(data);
        observer.complete();
      });
    });
  }

  qlResultToDomainModel(n: any, domainType: DomainTypeEnum) {
    const gPeriod = this.calculateGracePeriodPercentage(
      parseInt(n.expiryDate, 10)
    );
    const fData = {
      id: n.domain.id.toLowerCase(),
      labelName: n.domain.labelName.toLowerCase(),
      labelHash: n.domain.labelhash.toLowerCase(),
      isNotAvailable: false,
      domainType: domainType,
      expiry: (parseInt(n.expiryDate) * 1000).toString(),
      gracePeriodPercent: gPeriod > 100 ? undefined : 100 - Math.abs(gPeriod),
      registrationDate: (parseInt(n.registrationDate) * 1000).toString(),
      createdAt: (parseInt(n.domain.createdAt) * 1000).toString(),
    } as DomainMetadataModel;
    return fData;
  }

  downloadDomainsListNamesOnly(domains: DomainMetadataModel[]) {
    let finalForm = '';
    finalForm += domains
      .map((d) => {
        return d.labelName;
      })
      .join('\n');
    return finalForm;
  }

  downloadDomainsListCSV(domains: DomainMetadataModel[]) {
    let finalForm = '';
    finalForm +=
      Object.keys(domains[0])
        .filter((k) => {
          if (k === 'events') {
            return false;
          }
          return true;
        })
        .join(',') + '\n';
    finalForm += domains
      .map((d) => {
        const k = Object.keys(d);
        return k
          .map((kk) => {
            return d[kk];
          })
          .join(',');
      })
      .join('\n');
    return finalForm;
  }

  calculateExpiry(expiryDate: string) {
    const eDate = parseInt(expiryDate, 10) * 1000;
    const now = new Date().getTime();
    const remainingDate = now - eDate;
    return remainingDate;
  }

  calculateGracePeriodPercentage(expiryDate: number) {
    const now = new Date().getTime();
    const gracePeriod = THREE_MONTHS_IN_MILISECONDS_GRACE;
    const timeUntilGraceEnds = expiryDate * 1000 + gracePeriod;
    if (timeUntilGraceEnds < now) {
      return 0;
    }
    const gracePeriodExact = timeUntilGraceEnds - now;
    const gInPercent = gracePeriod / 100;
    return gracePeriodExact / gInPercent;
  }

  isDomainNameNotValid(
    name: string,
    prefixedOrSuffixed = false,
    prefixedAndSuffixed = false,
    minLengthOverride = 3,
    skipNormalisation = false
  ) {
    if (skipNormalisation === true) {
      return true;
    }
    let minLength = minLengthOverride;
    if (prefixedOrSuffixed === true) {
      minLength = 2;
    }
    if (prefixedAndSuffixed === true) {
      minLength = 1;
    }
    try {
      if (name === '' || this.getNameLength(name) < minLength) {
        return false;
      }
      const invalidCharsForcedFilter = invalidChars.join('');
      const invalidCharDetect = [...name].filter((c) => {
        if (invalidCharsForcedFilter.includes(c) === true) {
          return true;
        }
        return false;
      });
      if (invalidCharDetect.length > 0) {
        throw false;
      }
      const normed = ens_normalize(name);
      return true;
    } catch (e) {
      return false;
    }
  }

  performNormalisation(name: string) {
    return ens_normalize(name);
  }

  prettify(name: string) {
    return ens_beautify(name);
  }

  calculateDomainsPrice(
    name: string,
    ethToUsdRate: string,
    durationInYears: number = 1
  ) {
    const ethUsdRate = parseInt(ethToUsdRate, 10);
    let nameCost = 5;
    const count = this.getNameLength(name);
    switch (count) {
      case 3:
        {
          nameCost = 640;
        }
        break;
      case 4:
        {
          nameCost = 160;
        }
        break;
    }
    return parseFloat((nameCost / ethUsdRate).toFixed(4)) * durationInYears;
  }

  getNameLength(name: string) {
    const count = [...ens_normalize(name)].length;
    return count;
  }

  extraFilters(
    d: DomainMetadataModel,
    filters: DomainFiltersModel,
    baseFilter: any
  ) {
    const minL = baseFilter.minLength.value;
    const maxL = baseFilter.maxLength.value;
    const minD = this.miscUtils.getDateToStamp(baseFilter.creation.value);
    const regD = this.miscUtils.getDateToStamp(baseFilter.registration.value);
    const maxD = this.miscUtils.getDateToStamp(baseFilter.expiration.value);
    let satisfied;
    if (minD !== null && minD > 0 && parseInt(d.createdAt, 10) < minD) {
      return false;
    }
    if (regD !== null && regD > 0 && parseInt(d.registrationDate, 10) < regD) {
      return false;
    }
    if (maxD !== null && maxD > 0 && parseInt(d.expiry, 10) > maxD) {
      return false;
    }
    if (
      (this.getNameLength(d.labelName) >= minL &&
        this.getNameLength(d.labelName) <= maxL) === false
    ) {
      return false;
    }
    if (
      filters.prepunk === true &&
      parseInt(d.createdAt) / 1000 > PREPUNK_TIME
    ) {
      return false;
    }
    if (satisfied === undefined) {
      return true;
    }
    return satisfied;
  }

  extraFiltersPure(
    d: string,
    filters: DomainFiltersModel,
    baseFilter: any,
    prefixOffset: number,
    suffixOffset: number
  ) {
    if (d === null || this.isDomainNameNotValid(d) === false) {
      return false;
    }
    const minL = baseFilter === null ? 0 : baseFilter.minLength.value;
    const maxL = baseFilter === null ? 100 : baseFilter.maxLength.value;
    const contains = baseFilter === null ? '' : baseFilter.contains.value;
    const containEmoji = filters.emoji;
    const containAlphabet = filters.alphabet;
    const containNumber = filters.numbers;
    const palindrome = filters.palindrome;
    const repeating = filters.repeating;
    const nameLen = this.getNameLength(d);
    let satisfied;
    if ((nameLen >= minL && nameLen <= maxL) === false) {
      return false;
    }
    let nameToCheckForOffsets = [...d]
      .filter((r) => r.codePointAt(0) !== 8419)
      .join('');
    const prefixOffsetRemoved = nameToCheckForOffsets.substring(prefixOffset);
    const suffixOffsetRemoved = prefixOffsetRemoved.substring(
      0,
      prefixOffsetRemoved.length - suffixOffset
    );
    nameToCheckForOffsets = suffixOffsetRemoved;
    if (contains !== '') {
      if (nameToCheckForOffsets.indexOf(contains) > -1) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (repeating === true) {
      if (this.miscUtils.testRepeating(nameToCheckForOffsets) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (palindrome === true) {
      if (this.miscUtils.testPalindrome(nameToCheckForOffsets) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (containEmoji === true) {
      if (this.isEmojiInLabel(d) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (containAlphabet === false && containNumber === false) {
      satisfied = true;
    } else if (containAlphabet === true && containNumber === false) {
      if (this.isAlphabetInLabel(d) === true) {
        satisfied = true;
      } else {
        return false;
      }
    } else if (containNumber === true && containAlphabet === true) {
      if (this.isAlphaNumericLabel(d) === true) {
        satisfied = true;
      } else {
        return false;
      }
    } else if (containNumber === true) {
      if (this.isNumberInLabel(d) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (satisfied === undefined) {
      return true;
    }
    return satisfied;
  }

  getNameCategory(
    name: string,
    nameHash: string,
    dataSourceSets: CategoryModel[],
    optimisedCategoryData: any
  ) {
    let categoryFound;
    for (const c of dataSourceSets) {
      if (categoryFound !== undefined) {
        continue;
      }
      const isAlpha = this.miscUtils.testAlpha().test(name);
      const isNumeric = this.miscUtils.testIntNumeric().test(name);
      const isEmoji = this.miscUtils.testEmoji().test(name);
      let nameLength;
      try {
        nameLength = this.getNameLength(name);
      } catch (e) {
        nameLength = name.length;
      }
      const nameFirstChar = name[0];
      const nameSecondChar = name[1];
      const nameCodeHash = ethers.BigNumber.from(nameHash).toString();
      const idFirstChar = nameCodeHash[0];
      const idSecondChar = nameCodeHash[1];
      const pattern = new RegExp(c.pattern);
      if (isEmoji === false && c.max_length < nameLength) {
        continue;
      }
      if (
        isEmoji === true &&
        c.patterned === false &&
        idFirstChar in optimisedCategoryData === true &&
        idSecondChar in optimisedCategoryData === true &&
        optimisedCategoryData[idFirstChar][idSecondChar].includes(
          nameCodeHash
        ) === true
      ) {
        categoryFound = c.category;
        continue;
      }
      if (
        c.patterned === false &&
        nameFirstChar in optimisedCategoryData === true &&
        nameSecondChar in optimisedCategoryData === true &&
        optimisedCategoryData[nameFirstChar][nameSecondChar].includes(name) ===
          true
      ) {
        categoryFound = c.category;
        continue;
      }
      if (c.patterned === true && pattern.test(name) === true) {
        categoryFound = c.category;
        continue;
      }
    }
    return categoryFound;
  }

  optimiseCategoryNamesList(data: string[]) {
    let optimised = {};
    for (const s of data) {
      const firstChar = s.charAt(0);
      const secondChar = s.charAt(1);
      if (firstChar in optimised === false) {
        optimised[firstChar] = {};
      }
      if (secondChar in optimised[firstChar] === false) {
        optimised[firstChar][secondChar] = [];
      }
      optimised[firstChar][secondChar].push(s);
    }
    return optimised;
  }

  getDataOfObject(data: any) {
    return Object.keys(data).map((d) => data[d]);
  }

  isEmojiInLabel(label: string) {
    return this.miscUtils.testEmoji().test(label);
  }

  isNumberInLabel(label: string) {
    return this.miscUtils.testIntNumeric().test(label);
  }

  isAlphabetInLabel(label: string) {
    return this.miscUtils.testAlpha().test(label);
  }

  isAlphaNumericLabel(label: string) {
    return this.miscUtils.testAlphaNumeric().test(label);
  }

  shuffleListOfNames(arr: string[]) {
    let currentIndex = arr.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex],
        arr[currentIndex],
      ];
    }
    return arr;
  }

  get gracePeriodInMiliSeconds() {
    return THREE_MONTHS_IN_MILISECONDS_GRACE;
  }
  get premiumPeriodInMiliSeconds() {
    return TWENTY_ONE_DAYS_IN_MILISECONDS_PREMIUM;
  }

  get gracePeriodInSeconds() {
    return THREE_MONTHS_IN_SECONDS_GRACE;
  }
  get premiumPeriodInSeconds() {
    return TWENTY_ONE_DAYS_IN_SECONDS_PREMIUM;
  }

  get commitSingleGasCost() {
    return COMMIT_SINGLE_GAS;
  }

  get commitGasCost() {
    return COMMIT_GAS;
  }

  get registerGasCost() {
    return REGISTER_GAS;
  }

  get registerWithConfigGasCost() {
    return REGISTER_CONFIG_GAS;
  }

  get renewGasCost() {
    return RENEW_GAS;
  }
}
