import * as lodash from 'lodash';
import { Injectable } from '@angular/core';
import {
  PaymentModel,
  PaymentTypesEnum,
} from '../../models/states/payment-interfaces';
import {
  MonthsEnum,
  PaymentLogsModel,
  PaymentStatusTypesEnum,
  PaymentTypeStringsEnum,
} from '../../models/payments';
import { generalConfigurations } from '../../configurations';
import { payNoMarketAddress } from '../../models/pay-no-market-address.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentLogsService {
  constructor() {}

  normalisePaymentsToLogs(payments: PaymentModel[]) {
    if (payments.length <= 0) {
      return false;
    }
    const paymentsReversed = lodash.cloneDeep(payments);
    paymentsReversed.reverse();
    const paymentLogs: PaymentLogsModel = {};
    const addedDates = [];
    for (const p of paymentsReversed) {
      const paymentDate = new Date(p.paymentDate);
      const paymentMonth = paymentDate.getMonth() + 1;
      const normalizedDateRaw =
        paymentMonth +
        '/' +
        paymentDate.getDate() +
        '/' +
        paymentDate.getFullYear();
      const approximateDate = new Date(normalizedDateRaw);
      const normalizedDate = approximateDate.getTime();
      if (addedDates.indexOf(normalizedDate) <= -1) {
        addedDates.push(normalizedDate);
        paymentLogs[normalizedDate] = {
          dateString: this.determineDateString(p.paymentDate),
          logs: [],
        };
      }
    }
    for (const p of paymentsReversed) {
      const paymentDate = new Date(p.paymentDate);
      const paymentMonth = paymentDate.getMonth() + 1;
      const normalizedDateRaw =
        paymentMonth +
        '/' +
        paymentDate.getDate() +
        '/' +
        paymentDate.getFullYear();
      const approximateDate = new Date(normalizedDateRaw);
      const normalizedDate = approximateDate.getTime();
      paymentLogs[normalizedDate].logs.push(p);
    }
    return paymentLogs;
  }

  determineDateString(date: number) {
    const newDate = new Date(date);
    return (
      newDate.getDate() +
      ' ' +
      this.determineMonthString(newDate.getMonth()) +
      ' ' +
      newDate.getFullYear()
    );
  }

  determineMonthString(month: number) {
    return MonthsEnum[month];
  }

  determinePaymentTypeString(
    paymentData: PaymentModel,
    smartWalletAddress: string
  ) {
    switch (paymentData.paymentType) {
      case PaymentTypesEnum.PAY:
        {
          if (paymentData.paymentPayee === smartWalletAddress) {
            return PaymentTypeStringsEnum.PAYMENT_RECEIVED;
          }
          return PaymentTypeStringsEnum.PAYMENT_SENT;
        }
        break;
    }
  }

  determinePaymentStatus(
    paymentData: PaymentModel,
    smartWalletAddress: string
  ) {
    if ('paymentStatus' in paymentData && paymentData.paymentStatus === true) {
      return PaymentStatusTypesEnum.UNKNOWN;
    }

    if (
      'paymentStatus' in paymentData === false ||
      ('paymentStatus' in paymentData === true &&
        paymentData.paymentStatus === false) ||
      ('paymentStatus' in paymentData === true &&
        paymentData.paymentStatus === undefined) ||
      (smartWalletAddress !== paymentData.paymentPayer &&
        'paymentStatus' in paymentData === true &&
        paymentData.paymentStatus === false &&
        'approvalDecision' in paymentData === false) ||
      (smartWalletAddress !== paymentData.paymentPayer &&
        'approvalDecision' in paymentData === true &&
        'paymentStatus' in paymentData === true &&
        paymentData.paymentStatus === false &&
        'paymentHash' in paymentData === true &&
        paymentData.paymentHash !== null &&
        paymentData.paymentHash !== undefined)
    ) {
      return PaymentStatusTypesEnum.PENDING;
    }
    if (paymentData.paymentStatus === true && paymentData.paymentError === 0) {
      return PaymentStatusTypesEnum.COMPLETED;
    }
    return PaymentStatusTypesEnum.FAILED;
  }
}
