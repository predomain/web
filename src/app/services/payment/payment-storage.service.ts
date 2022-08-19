import { Injectable } from '@angular/core';
import { PaymentModel } from 'src/app/models/states/payment-interfaces';

const globalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class PaymentStorageService {
  constructor() {}

  get networkName() {
    return globalAny.networkName;
  }

  savePayments(paymentData: PaymentModel[]) {
    localStorage.setItem('canvas-payments-data', JSON.stringify(paymentData));
  }

  loadPayments() {
    const l = localStorage.getItem('canvas-payments-data');
    if (l === null || l === '[]' || l === '') {
      return false;
    }
    return JSON.parse(l);
  }
}
