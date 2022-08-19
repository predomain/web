import { Injectable } from '@angular/core';
import request, { gql } from 'graphql-request';
import { Observable } from 'rxjs';
import { ens_normalize } from '@adraffy/ens-normalize';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';

@Injectable({
  providedIn: 'root',
})
export class EnsService {
  constructor(private http: HttpClient) {}

  getDomainMetadata(domainHash: string) {
    const url = environment.networks[environment.defaultChain].ensMetadataAPI;
    return this.http.get(url + domainHash);
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
              createdAt
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

  downloadDomainsListCSV(domains: ENSDomainMetadataModel[]) {
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

  isDomainNameNotValid(name: string) {
    if (name === '' || name.length < 3) {
      return false;
    }
    try {
      ens_normalize(name + '.eth');
      return true;
    } catch (e) {
      return false;
    }
  }

  calculateDomainsPrice(
    name: string,
    ethToUsdRate: string,
    duration: number = 1
  ) {
    const ethUsdRate = parseInt(ethToUsdRate, 10);
    let nameCost = 5;
    switch (name.length) {
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
    return parseFloat((nameCost / ethUsdRate).toFixed(4)) * duration;
  }
}
