import { Injectable } from "@angular/core";
import { generalConfigurations } from "../../configurations";

@Injectable({
  providedIn: "root",
})
export class DecimalCurrencyMaskService {
  amount: any;

  transform(value: any, args?: any): any {
    let amount = String(value);

    const beforePoint = amount.split(".")[0];
    let integers = "";
    if (typeof beforePoint !== "undefined") {
      integers = beforePoint.replace(/\D+/g, "");
    }
    const afterPoint = amount.split(".")[1];
    let decimals = "";
    if (typeof afterPoint !== "undefined") {
      decimals = afterPoint.replace(/\D+/g, "");
    }
    if (decimals.length > generalConfigurations.maximumDecimalInPrices) {
      decimals = decimals.slice(
        0,
        generalConfigurations.maximumDecimalInPrices
      );
    }
    amount = integers;
    if (typeof afterPoint === "string") {
      amount += ".";
    }
    if (decimals.length > 0) {
      amount += decimals;
    }

    return amount;
  }

  transformInScript(val: string) {
    const regTest = new RegExp(/^-?\d+\.?\d*$/);
    const test = regTest.test(val);
    if (val !== "" && val !== undefined && val !== null && test === false) {
      const amount = val.toString();
      return amount.slice(0, val.length - 1);
    }
    if (val !== "" && val !== undefined && val !== null && test === true) {
      const maskedVal = this.transform(val.toString());
      if (val !== maskedVal) {
        return maskedVal;
      }
    }
    return val;
  }
}
