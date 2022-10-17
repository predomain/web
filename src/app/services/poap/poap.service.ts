import { Injectable } from '@angular/core';
import { gql, request } from 'graphql-request';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PoapService {
  constructor() {}

  getPoaps(walletAddress: string) {
    const url = environment.networks[environment.defaultChain].poapGraphQLAPI;
    return new Observable((observer) => {
      const query = gql`
        query ($id: String!) {
          accounts(where: { id: $id }) {
            id
            tokens {
              id
              event {
                id
              }
            }
          }
        }
      `;
      request(url, query, { id: walletAddress.toLowerCase() }).then((data) => {
        observer.next(data);
        observer.complete();
      });
    });
  }

  getPoapIds(poapResult: any) {
    if ('accounts' in poapResult === false) {
      return false;
    }
    if (poapResult.accounts.length <= 0) {
      return false;
    }
    return poapResult.accounts[0].tokens.map((t) => {
      return t.event.id;
    });
  }

  getPoapTokens(poapResult: any) {
    if ('accounts' in poapResult === false) {
      return false;
    }
    if (poapResult.accounts.length <= 0) {
      return false;
    }
    return poapResult.accounts[0].tokens;
  }

  getPoapTokensByPoapId(poapTokens: any, poapId) {
    if (
      poapTokens === false ||
      poapTokens === undefined ||
      poapTokens.length <= 0
    ) {
      return false;
    }
    return poapTokens
      .filter((t) => {
        return t.event.id === poapId;
      })
      .map((t) => {
        return t.id;
      });
  }
}
