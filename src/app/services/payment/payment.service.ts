import { Injectable } from '@angular/core';
import { UserService } from '../user';
import { CurrencyService } from '../currency';
import { WalletService } from '../wallet';
import { PaymentModel } from 'src/app/models/states/payment-interfaces';
import { Observable } from 'rxjs';
import { BigNumber, ethers } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';

const globalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(
    protected userService: UserService,
    protected currencyService: CurrencyService,
    protected walletService: WalletService
  ) {}

  prepareTransaction(
    chainId: number,
    nonce: number,
    toAddress: string,
    gasLimit: string,
    gasPrice: string,
    payment: PaymentModel
  ) {
    const paymentLoad = {
      chainId: chainId,
      nonce: nonce,
      to: toAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      value: payment.paymentTotal,
      data: payment.paymentAbstractBytesSlot,
    };
    return paymentLoad;
  }

  resolveAddressOfEth(provider: Provider, walletAddress: string) {
    return new Observable((observer) => {
      provider.resolveName(walletAddress).then((n) => {
        observer.next(n);
        observer.complete();
      });
    });
  }

  getWalletNonce(provider: Provider, walletAddress: string) {
    return new Observable((observer) => {
      provider.getTransactionCount(walletAddress).then((n) => {
        observer.next(n);
        observer.complete();
      });
    });
  }

  getGasPrice(provider: Provider) {
    return new Observable((observer) => {
      provider
        .getFeeData()
        .then((feeData) => {
          observer.next(feeData);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }
}
