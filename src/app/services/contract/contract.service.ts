import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  constructor() {}

  getGasLimitEstimation(
    provider = null,
    method: string,
    params: any,
    payer: string,
    contractAddress: string = null,
    contractABI: any = null,
    providerFunction = false,
    value: string = '0x0'
  ) {
    let c;
    if (
      providerFunction === false &&
      (contractAddress === null || contractABI === null)
    ) {
      return of(false);
    }
    if (providerFunction === false) {
      c = new Contract(contractAddress, contractABI, provider);
    }
    return new Observable((observer) => {
      if (providerFunction === false) {
        c.estimateGas[method](...params, {
          value,
          from: payer,
        })
          .then((r) => {
            if (r === null) {
              observer.next(false);
              observer.complete();
            }
            observer.next(r);
            observer.complete();
          })
          .catch((e) => {
            observer.next(false);
            observer.complete();
          });
      } else {
        provider
          .estimateGas(params)
          .then((r) => {
            if (r === null) {
              observer.next(false);
              observer.complete();
            }
            observer.next(r);
            observer.complete();
          })
          .catch((e) => {
            observer.next(false);
            observer.complete();
          });
      }
    });
  }
}
