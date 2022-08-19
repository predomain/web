import { Injectable, NgZone } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PagesFacadeService, UserFacadeService } from '../../store/facades';
import { MiscUtilsService } from '../misc-utils';
import { UserRegistrationModel } from 'src/app/models/states/user-interfaces';
import { WalletTypesEnum } from 'src/app/models/states/wallet-interfaces';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { UserStoreErrorsEnum } from 'src/app/models/error-enums';
import { generalConfigurations } from 'src/app/configurations';

const globalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class WalletConnectService {
  constructor(
    public miscUtils: MiscUtilsService,
    public userFacadeService: UserFacadeService,
    public pagesFacade: PagesFacadeService,
    public userFacade: UserFacadeService,
    protected ngZone: NgZone
  ) {
    const dateNow = new Date().getTime();
    if (globalAny.walletConnect === undefined) {
      const connector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
        qrcodeModal: QRCodeModal,
        qrcodeModalOptions: {
          mobileLinks: generalConfigurations.wallectConnectSupportedWallets,
          desktopLinks: [],
        },
        clientMeta: generalConfigurations.appMeta,
      });
      connector.on('connect', (error, payload) => {
        if (error) {
          throw error;
        }
        const { accounts, chainId } = payload.params[0];
        const currentChainId = globalAny.chainId;
        if (currentChainId !== chainId) {
          this.userFacadeService.removeUser();
          const wc = globalAny.walletConnect as WalletConnect;
          wc.killSession();
          this.userFacade.setErrorState(UserStoreErrorsEnum.CONNECT_ERROR);
          this.pagesFacade.setNetworkChainCode(parseInt(chainId, 16));
          return;
        }
        this.connect(dateNow, accounts[0]);
      });
      connector.on('session_update', (error, payload) => {
        if (error) {
          throw error;
        }
        const { accounts, chainId } = payload.params[0];
        const currentChainId = globalAny.chainId;
        const currentAccount = globalAny.chainAccount;
        if (
          currentChainId !== chainId ||
          currentAccount.walletAddress.toLowerCase() !==
            accounts[0].toLowerCase()
        ) {
          this.userFacadeService.removeUser();
          const wc = globalAny.walletConnect as WalletConnect;
          wc.killSession();
          this.pagesFacade.setNetworkChainCode(parseInt(chainId, 16));
          this.userFacadeService.removeUser();
          this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
          return;
        }
      });
      connector.on('disconnect', (error, payload) => {
        if (error) {
          throw error;
        }
      });
      globalAny.walletConnect = connector;
    }
  }

  createSession() {
    globalAny.walletConnect.createSession();
  }

  connect(time: number, account: string) {
    this.userFacade.registerUser({
      walletType: WalletTypesEnum.WALLET_CONNECT,
      address: account,
    } as UserRegistrationModel);
  }

  getChainId() {
    return globalAny.chainId;
  }

  signPayment(payloadHash: any) {
    return new Observable((observer) => {
      globalAny.walletConnect
        .sendTransaction(payloadHash)
        .then((tx) => {
          if (tx === null || tx.length <= 0 || tx === undefined) {
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(tx);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }
}
