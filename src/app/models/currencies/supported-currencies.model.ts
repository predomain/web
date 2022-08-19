import { SupportedCurrenciesEnum } from "../../configurations/contracts";
import { SupportedCurrencyModel } from "./supported-currency.model";

export class SupportedCurrenciesModel {
  currencies: SupportedCurrencyModel[] = [];
  constructor() {
    const supportedCurrencies = Object.keys(SupportedCurrenciesEnum).map(
      (key) => {
        return {
          cKey: key,
          cValue: SupportedCurrenciesEnum[key],
        };
      }
    );
    for (const supportedCurrency of supportedCurrencies) {
      this.currencies.push({
        id: supportedCurrency.cKey.toLowerCase(),
        symbol: supportedCurrency.cKey.toUpperCase(),
        name: supportedCurrency.cValue,
        selected: false,
      } as SupportedCurrencyModel);
    }
  }
}
