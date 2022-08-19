import * as Ethers from 'ethers';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MiscUtilsService } from '../misc-utils';
import { catchError, switchMap } from 'rxjs/operators';
import { PagesFacadeService, UserFacadeService } from '../../store/facades';
import detectEthereumProvider from '@metamask/detect-provider';

declare const ethereum;
@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  constructor(
    public miscUtils: MiscUtilsService,
    public userFacadeService: UserFacadeService,
    public pagesFacade: PagesFacadeService
  ) {}

  connect(time: number) {
    return this.getAccounts().pipe(
      switchMap((a) => {
        const accounts = a as any;
        if (
          accounts === undefined ||
          accounts === null ||
          accounts.length <= 0
        ) {
          return of(false);
        }
        return of(a[0]);
      }),
      catchError((e) => {
        return of(false);
      })
    );
  }

  chainChangedDetectionDaemon() {
    ethereum.on('chainChanged', (chainId) => {
      this.pagesFacade.setNetworkChainCode(parseInt(chainId, 16));
    });
  }

  getChainId() {
    return ethereum.networkVersion;
  }

  getAccounts() {
    return new Observable((observer) => {
      ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          if (
            accounts === null ||
            accounts.length <= 0 ||
            accounts === undefined
          ) {
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(
            accounts.map((a) => {
              return Ethers.utils.getAddress(a);
            })
          );
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  signPayment(payloadHash: any) {
    return new Observable((observer) => {
      detectEthereumProvider()
        .then((p: any) => {
          return p.request({
            method: 'eth_sendTransaction',
            params: payloadHash,
          });
        })
        .then((tx) => {
          if (tx === null || tx.length <= 0 || tx === undefined) {
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(tx);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getWeb3Provider() {
    return new Observable((observer) => {
      detectEthereumProvider()
        .then((p) => {
          observer.next(p);
          observer.complete();
        })
        .catch((e) => {
          observer.next(null);
          observer.complete();
        });
    });
  }
}
