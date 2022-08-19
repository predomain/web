import { Injectable } from '@angular/core';
import { WalletService } from '../wallet';
import { UserFacadeService } from '../../store/facades';
import { Provider } from '@ethersproject/abstract-provider';
import { Observable } from 'rxjs';
import { request, gql } from 'graphql-request';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    public userFacade: UserFacadeService,
    public walletService: WalletService
  ) {}

  getUserDomains(walletAddress: string) {
    const url = environment.networks[environment.defaultChain].ensGraphQLAPI;
    return new Observable((observer) => {
      const query = gql`
        { 
          registrations(first: 1000, where: { registrant: "${walletAddress}" }) {
            expiryDate
            registrationDate
            domain{
              createdAt
              labelName
              labelhash
              id
              events{
                id
                blockNumber
                transactionID
              }
            }
          }
        }
      `;
      request(url, query).then((data) => {
        observer.next(data);
        observer.complete();
      });
    });
  }

  getEthAddress(provider: Provider, ethName: string) {
    return new Observable((observer) => {
      (provider as any)
        .resolveName(ethName)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getEthName(provider: Provider, walletAddress: string) {
    return new Observable((observer) => {
      (provider as any)
        .lookupAddress(walletAddress)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getUserText(provider: Provider, ethName: string, text: string) {
    return new Observable((observer) => {
      (provider as any)
        .getResolver(ethName)
        .then((resolver) => {
          return resolver.getText(text);
        })
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getUserContentHash(provider: Provider, ethName: string) {
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
}
