import * as ethers from 'ethers';
import { BigNumber } from 'ethers';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import {
  acceptedCurrenciesMainnet,
  acceptedCurrenciesTestnet,
  ContractAddressesMainnetEnum,
  ContractAddressesTestnetEnum,
  SupportedCurrenciesEnum,
} from '../../configurations/contracts';
import { AcceptedCurrencyModel } from '../../models/currencies';
import { PaymentTypesEnum } from '../../models/states/payment-interfaces';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  constructor() {}
  /**
   * Environment production: mainnet contracts are used.
   * Environment development (true): devnet contracts are used.
   * Environment development (false): testnet (ropsten) contracts are used.
   * @param currency
   */
  deriveCurrencyAddressFromName(currency: string) {
    let currencies;
    if (environment.production === true) {
      currencies = Object(ContractAddressesMainnetEnum);
    } else {
      currencies = Object(ContractAddressesTestnetEnum);
    }
    return currencies[currency.toUpperCase()];
  }

  deriveCurrencyDataFromCurrencyName(currency: string) {
    let currencies;
    if (environment.production === true) {
      currencies = Object(acceptedCurrenciesMainnet) as AcceptedCurrencyModel[];
    } else {
      currencies = Object(acceptedCurrenciesTestnet) as AcceptedCurrencyModel[];
    }
    let currencySearched: any = false;
    for (const c of currencies) {
      if (c.currency === currency) {
        currencySearched = c as AcceptedCurrencyModel;
      }
    }
    return currencySearched;
  }

  convertAmountToDecimal(amountInString: string, currency: string) {
    const paymentCurrency = this.deriveCurrencyDataFromCurrencyName(currency);
    if (paymentCurrency === false) {
      return false;
    }
    const currencyData = paymentCurrency as AcceptedCurrencyModel;
    const bnAmount = BigNumber.from(amountInString);
    return ethers.utils.formatUnits(bnAmount, currencyData.decimals);
  }

  convertAmountToToken(amountInString: string, currency: string) {
    const paymentCurrency = this.deriveCurrencyDataFromCurrencyName(currency);
    if (paymentCurrency === false) {
      return false;
    }
    const currencyData = paymentCurrency as AcceptedCurrencyModel;
    return ethers.utils.parseUnits(amountInString, currencyData.decimals);
  }

  getSupportedCurrencies() {
    let currencies;
    if (environment.production === true) {
      currencies = Object(acceptedCurrenciesMainnet) as AcceptedCurrencyModel[];
    } else {
      currencies = Object(acceptedCurrenciesTestnet) as AcceptedCurrencyModel[];
    }
    return currencies as AcceptedCurrencyModel[];
  }

  determineDefaultCurrencyForPayment(
    searchType: PaymentTypesEnum,
    chooseSecondDefault = false
  ) {
    let secondDefaultToBeChosen = false;
    for (const c of Object.keys(SupportedCurrenciesEnum)) {
      const currencyData = this.deriveCurrencyDataFromCurrencyName(
        c
      ) as AcceptedCurrencyModel;
      if (searchType === PaymentTypesEnum.PAY) {
        if (chooseSecondDefault === true && secondDefaultToBeChosen === false) {
          secondDefaultToBeChosen = true;
        } else {
          return c;
        }
      }
    }
  }
}
