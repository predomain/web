import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MiscUtilsService } from '../misc-utils';
import TransportUSB from '@ledgerhq/hw-transport-webusb';
import LedgerEth from '@ledgerhq/hw-app-eth';
import { PagesFacadeService } from '../../store/facades';
import detectEthereumProvider from '@metamask/detect-provider';

interface LedgerSignResultModel {
  v: number;
  r: string;
  s: string;
}

interface LedgerGetAddressResultModel {
  address: string;
  chainCode: string;
  publicKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  transport: any;
  ledger: LedgerEth;

  constructor(
    public miscUtils: MiscUtilsService,
    public pagesFacade: PagesFacadeService
  ) {}

  connect(time: number) {
    return new Observable((observer) => {
      TransportUSB.create()
        .then((r) => {
          this.transport = r;
          this.ledger = new LedgerEth(r);
          return this.ledger.getAddress("m/44'/60'/0'/0/0");
        })
        .then((r: any) => {
          if (r === false) {
            observer.next(false);
            observer.complete();
            return;
          }
          const result = r as any as LedgerGetAddressResultModel;
          observer.next(result.address);
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

  createTransport() {
    return new Observable((observer) => {
      TransportUSB.create().then((r) => {
        this.transport = r;
        this.ledger = new LedgerEth(r);
        observer.next(this.ledger);
        observer.complete();
        return;
      });
    });
  }

  signPayment(payload: string) {
    return new Observable((observer) => {
      this.ledger
        .signTransaction("m/44'/60'/0'/0/0", payload.substring(2))
        .then((r) => {
          if (r === null || r === undefined) {
            observer.next(false);
            observer.complete();
            return;
          }
          const signed = r as any as LedgerSignResultModel;
          observer.next(signed);
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
