import { Injectable } from '@angular/core';
import { providers } from 'ethers';
import { generalConfigurations } from 'src/app/configurations';
import { RPCProviderModel } from 'src/app/models/rpc/rpc-provider.model';
import { ValidRPCProvidersEnum } from 'src/app/models/rpc/valid-rpc-providers.enum';
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

  getUserSessionProvider(
    chainId: number,
    providerData: RPCProviderModel = null
  ) {
    let newProvider;
    if (providerData === null) {
      newProvider = this.createAlchemyFrontDefaultProvider(chainId);
    } else if (providerData.type === ValidRPCProvidersEnum.ALCHEMY) {
      newProvider = this.createAlchemyFrontProvider(
        chainId,
        providerData.secret
      );
    } else if (providerData.type === ValidRPCProvidersEnum.INFURA) {
      newProvider = this.createInfuraFrontProvider(
        chainId,
        providerData.id,
        providerData.secret
      );
    } else if (providerData.type === ValidRPCProvidersEnum.CUSTOM) {
      newProvider = this.createJSONFrontProvider(chainId, providerData.url);
    }
    return newProvider;
  }

  getDefaultChainId() {
    return environment.networks[environment.defaultChain].chainId;
  }

  createAlchemyFrontDefaultProvider(chain: number) {
    const providerKeys = JSON.parse(
      environment.networks[environment.defaultChain].providerKey
    );
    const providerKeyPicked = Math.floor(Math.random() * providerKeys.length);
    return new providers.AlchemyWebSocketProvider(
      chain,
      providerKeys[providerKeyPicked]
    );
  }

  createAlchemyFrontProvider(chain: number, secret: string) {
    return new providers.AlchemyWebSocketProvider(chain, secret);
  }

  createInfuraFrontProvider(chain: number, id: string, secret: string) {
    return new providers.InfuraProvider(chain, {
      projectId: id,
      projectSecret: secret,
    });
  }

  createJSONFrontProvider(chain: number, url: string) {
    if (url.indexOf('http') <= -1) {
      return new providers.IpcProvider(url, chain);
    }
    return new providers.JsonRpcProvider(url, chain);
  }

  getUserIdFromDomain() {
    let routeArr = document.location.href.split('/');
    routeArr = routeArr.slice(4, routeArr.length);
    let primaryDomain;
    if (document.location.href.indexOf('//localhost') <= -1) {
      primaryDomain = document.location.href.split('https://')[1].split('.')[0];
    }
    if (
      primaryDomain !== undefined &&
      primaryDomain !== generalConfigurations.appName &&
      document.location.href.indexOf(
        'https://' + generalConfigurations.appStagingName + '.eth'
      ) <= -1
    ) {
      return primaryDomain;
    }
    return null;
  }
}
