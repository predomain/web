import { Injectable } from '@angular/core';
import { providers } from 'ethers';
import { environment } from '../../../environments/environment';
import { UserModel } from '../../models/states/user-interfaces';
import { MetamaskService } from '../metamask';

declare const localStorage;

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  constructor(public metamaskService: MetamaskService) {}

  quitUserSession() {
    localStorage.removeItem('canvas-user-session');
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
  }

  saveUserSession(userData: UserModel) {
    localStorage.setItem('canvas-user-session', JSON.stringify(userData));
  }

  loadUserSession() {
    return localStorage.getItem('canvas-user-session');
  }

  getUserSessionProvider(chainId: number) {
    const newProvider = this.createAlchemyFrontProvider(chainId);
    return newProvider;
  }

  getDefaultChainId() {
    return environment.networks[environment.defaultChain].chainId;
  }

  createAlchemyFrontProvider(chain: number) {
    return new providers.AlchemyWebSocketProvider(
      chain,
      environment.networks[environment.defaultChain].providerKey
    );
  }
}
