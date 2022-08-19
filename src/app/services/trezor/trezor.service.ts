import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import TrezorConnect from 'trezor-connect';
import { MiscUtilsService } from '../misc-utils';
import { PagesFacadeService } from '../../store/facades';
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, utils } from 'ethers';
import { generalConfigurations } from 'src/app/configurations';

interface TrezorSignedTransactionModel {
  id: number;
  success: boolean;
  payload: {
    v: string;
    r: string;
    s: string;
  };
}

interface TrezorGetAccountInfoResultModel {
  id: number;
  success: boolean;
  payload: {
    availableBalance: string;
    balance: string;
    descriptor: string;
    empty: boolean;
    history: {
      tokens: string[];
      total: number;
      transactions: any[];
      unconfirmed: number;
    };
    misc: {
      nonce: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class TrezorService {
  constructor(
    public miscUtils: MiscUtilsService,
    public pagesFacade: PagesFacadeService
  ) {}

  connect(time: number) {
    return new Observable((observer) => {
      TrezorConnect.init({
        lazyLoad: false,
        webusb: true,
        popup: true,
        manifest: generalConfigurations.trezorManifest,
      })
        .then((r) => {
          return TrezorConnect.getAccountInfo({
            path: "m/44'/60'/0'/0/0",
            coin: 'eth',
          });
        })
        .then((r) => {
          const result = r as any as TrezorGetAccountInfoResultModel;
          if (r === undefined) {
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(result.payload.descriptor);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
          return;
        });
    });
  }

  signPayment(payload: any) {
    return new Observable((observer) => {
      TrezorConnect.getAccountInfo({
        path: "m/44'/60'/0'/0/0",
        coin: 'eth',
      })
        .then((r) => {
          const accountInfo = r as any as TrezorGetAccountInfoResultModel;
          return TrezorConnect.ethereumSignTransaction({
            path: "m/44'/60'/0'/0/0",
            transaction: {
              ...payload,
              from: accountInfo.payload.descriptor,
              nonce: BigNumber.from(payload.nonce).toHexString(),
            },
          });
        })
        .then((r) => {
          const signed = r as any as TrezorSignedTransactionModel;
          if (
            signed === null ||
            signed.success === false ||
            signed === undefined
          ) {
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(
            utils.serializeTransaction(payload, {
              v: BigNumber.from(signed.payload.v).toNumber(),
              r: signed.payload.r,
              s: signed.payload.s,
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
