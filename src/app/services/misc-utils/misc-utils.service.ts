import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class MiscUtilsService {
  constructor() {}

  roundUp(num: number, roundTo: number) {
    return Math.round(num / roundTo) * roundTo;
  }

  testJSON(json) {
    const str = json.toString();
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  checksumEtheruemAddress(address: string) {
    try {
      return (
        ethers.utils.getAddress(address).toLowerCase() === address.toLowerCase()
      );
    } catch (e) {
      return false;
    }
  }

  commafied(num: string) {
    if (num.toString().indexOf('.') <= -1) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      const parts = num.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
  }

  prependToArray(value: any, array: any[]) {
    var newArray = array.slice();
    newArray.unshift(value);
    return newArray;
  }

  toHex(str: string) {
    const rb = new TextEncoder().encode(str);
    let r = '';
    for (const b of rb) {
      r += ('0' + b.toString(16)).slice(-2);
    }
    return r;
  }

  testNumeric() {
    const reg = new RegExp(/^(0|[1-9]\d*)(\.\d+)?$/);
    return reg;
  }

  testAlphaNumeric() {
    const reg = new RegExp('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$');
    return reg;
  }

  testAlpha() {
    const reg = new RegExp('^[A-Za-z]+$');
    return reg;
  }

  testEmoji() {
    const reg = new RegExp(/\p{Extended_Pictographic}/u);
    return reg;
  }

  testIntNumeric() {
    const reg = new RegExp('^[0-9]+$');
    return reg;
  }
}
