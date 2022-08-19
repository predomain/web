import { Injectable } from "@angular/core";
import { PaymentStoreErrorsEnum } from "../../models/error-enums";
import { PaymentErrorCodes } from "../../models/states/payment-interfaces";

@Injectable({
  providedIn: "root",
})
export class PaymentErrorService {
  constructor() {}

  getPaymentErrorTranslatedTextKey(paymentError: PaymentStoreErrorsEnum) {
    switch (paymentError) {
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_AMOUNT_ZERO:
        {
          return "ERRORS.PAYMENT_FAILED_INSUFFICIENT_FUNDS";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_INSUFFICIENT_FUNDS:
        {
          return "ERRORS.PAYMENT_FAILED_INSUFFICIENT_FUNDS";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_EXPIRED:
        {
          return "ERRORS.PAYMENT_FAILED_EXPIRED";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_UNKNOWN:
        {
          return "ERRORS.PAYMENT_FAILED_UNKNOWN";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_TOKEN_NOT_SUPPORTED:
        {
          return "ERRORS.PAYMENT_FAILED_TOKEN_NOT_SUPPORTED";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_WALLET_INITIALISATION_FAILURE:
        {
          return "ERRORS.PAYMENT_FAILED_WALLET_INITIALISATION_FAILURE";
        }
        break;

      case PaymentStoreErrorsEnum.PAYMENT_FAILED_SIGNATURE_INVALID:
        {
          return "ERRORS.PAYMENT_FAILED_SIGNATURE_INVALID";
        }
        break;
      case PaymentStoreErrorsEnum.PAYMENT_FAILED_WITHDRAW_FAILURE:
        {
          return "ERRORS.PAYMENT_FAILED_WITHDRAW_FAILURE";
        }
        break;

      case PaymentStoreErrorsEnum.PAYMENT_FAILED_WALLET_ID_TAKEN:
        {
          return "ERRORS.PAYMENT_FAILED_WALLET_ID_TAKEN";
        }
        break;

      case PaymentStoreErrorsEnum.PAYMENT_FAILED_MULTISIG_QUORUM_FAILED:
        {
          return "ERRORS.PAYMENT_FAILED_MULTISIG_QUORUM_FAILED";
        }
        break;

      case PaymentStoreErrorsEnum.PAYMENT_FAILED_MULTISIG_STORAGE_FULL:
        {
          return "ERRORS.PAYMENT_FAILED_MULTISIG_STORAGE_FULL";
        }
        break;

      case PaymentStoreErrorsEnum.PAYMENT_FAILED_MULTISIG_NO_ENTRY:
        {
          return "ERRORS.PAYMENT_FAILED_MULTISIG_NO_ENTRY";
        }
        break;
    }
  }
  getPaymentErrorEnumKey(errorCode: PaymentErrorCodes) {
    switch (errorCode) {
      case PaymentErrorCodes.AMOUNT_ZERO:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_AMOUNT_ZERO;
        }
        break;
      case PaymentErrorCodes.INSUFFICIENT_FUNDS:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_INSUFFICIENT_FUNDS;
        }
        break;
      case PaymentErrorCodes.PAYMENT_EXPIRED:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_EXPIRED;
        }
        break;
      case PaymentErrorCodes.PAYMENT_FAILURE:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_UNKNOWN;
        }
        break;
      case PaymentErrorCodes.TOKEN_NOT_SUPPORTED:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_TOKEN_NOT_SUPPORTED;
        }
        break;
      case PaymentErrorCodes.SIGNATURE_INVALID:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_WALLET_INITIALISATION_FAILURE;
        }
        break;
      case PaymentErrorCodes.MARKET_NOT_SUPPORTED:
        {
          return PaymentStoreErrorsEnum.PAYMENT_FAILED_MARKET_NOT_SUPPORTED;
        }
        break;
    }
  }
}
