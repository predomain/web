import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class MiscUtilsService {
  constructor() {}

  moveArray(arr: any[], oldIndex: number, newIndex: number) {
    if (newIndex >= arr.length) {
      let k = newIndex - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr;
  }

  shuffleArray(arr: any) {
    if (typeof arr === 'object') {
      return arr;
    }
    let currentIndex = arr.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex],
        arr[currentIndex],
      ];
    }
    return arr;
  }

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

  testUrl() {
    const expression =
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    const test = new RegExp(expression);
    return test;
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

  testPalindrome(str: string) {
    const len = str.length;
    for (let i = 0; i < len / 2; i++) {
      if (str[i] !== str[len - 1 - i]) {
        return false;
      }
    }
    return true;
  }

  testRepeating(str: string) {
    const chars = [...new Set(str)];
    return chars.length === 1;
  }

  parseXml(xml) {
    var dom = null;
    try {
      dom = new DOMParser().parseFromString(xml, 'text/xml');
    } catch (e) {
      dom = null;
    }
    return dom;
  }

  getDateToStamp(date: string) {
    if (date === '') {
      return null;
    }
    const d = new Date(date);
    return d.getTime();
  }
}
