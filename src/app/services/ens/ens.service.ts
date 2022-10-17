import { Injectable, Provider } from '@angular/core';
import request, { gql } from 'graphql-request';
import { Observable } from 'rxjs';
import { ens_normalize, ens_beautify } from '@adraffy/ens-normalize';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DomainMetadataModel } from 'src/app/models/domains';
import { invalidChars } from 'src/app/configurations';

const REGISTER_GAS = 175000;
const REGISTER_CONFIG_GAS = 300000;
const COMMIT_GAS = 25000;
const COMMIT_SINGLE_GAS = 55000;
const RENEW_GAS = 150000;

@Injectable({
  providedIn: 'root',
})
export class EnsService {
  constructor(private http: HttpClient) {}

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

  findDomains(domains: string[]) {
    const url = environment.networks[environment.defaultChain].ensGraphQLAPI;
    return new Observable((observer) => {
      const query = gql`
        query ($domainNames: [String!]) {
          registrations(first: 1000, where: { labelName_in: $domainNames }) {
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
      request(url, query, { domainNames: domains }).then((data) => {
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
    const gracePeriod = 7889400000;
    const timeUtilGraceEnds = expiryDate * 1000 + gracePeriod;
    const gracePeriodExact = timeUtilGraceEnds - now;
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
