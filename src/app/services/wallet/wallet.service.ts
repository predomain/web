import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Wallet, utils } from 'ethers';
import { UserFacadeService } from '../../store/facades';
import { NonceTypesEnum } from '../../models/states/wallet-interfaces';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  constructor(public userFacade: UserFacadeService, public http: HttpClient) {}

  produceNonce(type: NonceTypesEnum = NonceTypesEnum.TOKEN): string {
    const nonceLength = type === NonceTypesEnum.TOKEN ? 32 : 15;
    const charLibrary =
      '0123456789' +
      (type === NonceTypesEnum.TOKEN
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
        : '');
    let nonceString = '';
    for (let i = 0; i < nonceLength; i++) {
      const rnum = Math.floor(Math.random() * charLibrary.length);
      nonceString += charLibrary.substring(rnum, rnum + 1);
    }
    return nonceString;
  }

  checksumEtheruemAddress(address: string) {
    try {
      utils.getAddress(address);
    } catch (e) {
      return false;
    }
    return true;
  }

  validateWalletAddress(address: string) {
    if (this.checksumEtheruemAddress(address) === false) {
      return false;
    }
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else if (
      /^(0x)?[0-9a-f]{40}$/.test(address) ||
      /^(0x)?[0-9A-F]{40}$/.test(address)
    ) {
      return true;
    } else {
      return true;
    }
  }
}
