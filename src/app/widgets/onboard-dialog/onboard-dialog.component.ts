import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserStoreErrorsEnum } from '../../models/error-enums';
import { UserRegistrationModel } from '../../models/states/user-interfaces';
import { WalletTypesEnum } from '../../models/states/wallet-interfaces';
import { UserFacadeService } from '../../store/facades';
import { SpinnerModesEnum } from 'src/app/models/spinner/spinner-modes.enum';
import QRCodeModal from '@walletconnect/qrcode-modal';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';

import { WalletConnectService } from 'src/app/services/wallet-connect';
const globalAny: any = global;

@Component({
  selector: 'app-onboard-dialog',
  templateUrl: './onboard-dialog.component.html',
  styleUrls: ['./onboard-dialog.component.scss'],
})
export class OnboardDialogComponent implements OnInit, OnDestroy {
  overlaysCountOnInit = 0;
  closedByButton = false;
  userFacadeSubscription: any;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  chosenWalletType: WalletTypesEnum;

  constructor(
    public walletConnectService: WalletConnectService,
    public genericDialogRef: MatDialogRef<OnboardDialogComponent>,
    public userFacadeService: UserFacadeService,
    protected ngZone: NgZone
  ) {}

  ngOnInit() {
    this.userFacadeService.removeUserStateError();
    this.checkForConnect();
    this.genericDialogRef.backdropClick().subscribe(() => {
      if (this.closedByButton === true) {
        return;
      }
      this.closeDialog();
    });
    const overlays = document.getElementsByClassName(
      'cdk-overlay-dark-backdrop'
    );
    const wrappers = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );
    this.overlaysCountOnInit = overlays.length;
    if (overlays.length > 1) {
      for (let i = 1; i < overlays.length; i++) {
        overlays[i].remove();
      }
      const attr = document.createAttribute('style');
      attr.value = 'z-index: 1001 !important;';
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr =
        wrappers[wrappers.length - 1].attributes.getNamedItem('style');
      const newAttr = document.createAttribute('style');
      newAttr.value = existingAttr.value + ' z-index: 1001 !important;';
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      return;
    }
  }

  checkForConnect() {
    this.userFacadeSubscription = this.userFacadeService.userState$
      .pipe(
        map((s) => {
          if (
            s.user !== undefined &&
            s.user !== null &&
            Object.keys(s.user).length > 0 &&
            'walletAddress' in s.user === true &&
            s.user.walletAddress !== undefined
          ) {
            this.closeDialog();
            return;
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.userFacadeSubscription) {
      this.userFacadeSubscription.unsubscribe();
      this.userFacadeSubscription = undefined;
    }
  }

  openWalletConnect() {
    this.chosenWalletType = WalletTypesEnum.WALLET_CONNECT;
    this.walletConnectService.createSession();
  }

  openMetamaskConnect() {
    this.chosenWalletType = WalletTypesEnum.METAMASK;
    this.userFacadeService.registerUser({
      walletType: WalletTypesEnum.METAMASK,
    } as UserRegistrationModel);
  }

  openLedgerConnect() {
    this.chosenWalletType = WalletTypesEnum.LEDGER;
    this.userFacadeService.registerUser({
      walletType: WalletTypesEnum.LEDGER,
    } as UserRegistrationModel);
  }

  openTrezorConnect() {
    this.chosenWalletType = WalletTypesEnum.TREZOR;
    this.userFacadeService.registerUser({
      walletType: WalletTypesEnum.TREZOR,
    } as UserRegistrationModel);
  }

  closeDialog() {
    this.closedByButton = true;
    const overlays = document.getElementsByClassName(
      'cdk-overlay-dark-backdrop'
    );
    const wrappers = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );
    if (this.overlaysCountOnInit > 1) {
      const attr = document.createAttribute('style');
      attr.value = 'z-index: 1000 !important;';
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr =
        wrappers[wrappers.length - 1].attributes.getNamedItem('style');
      const newAttr = document.createAttribute('style');
      newAttr.value = existingAttr.value + ' z-index: 1001 !important;';
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      this.genericDialogRef.close();
      return;
    }
    this.genericDialogRef.close();
  }

  get loadingProgressImage() {
    switch (this.chosenWalletType) {
      case WalletTypesEnum.METAMASK:
        {
          return 'assets/metamask-connect-in-progress.png';
        }
        break;
      case WalletTypesEnum.TREZOR:
        {
          return 'assets/trezor-connect-in-progress.png';
        }
        break;

      case WalletTypesEnum.LEDGER:
        {
          return 'assets/ledger-connect-in-progress.png';
        }
        break;
      case WalletTypesEnum.WALLET_CONNECT:
        {
          return 'assets/wallet-connect-logo.png';
        }
        break;
      default:
        return 'assets/metamask-connect-in-progress.png';
        break;
    }
  }

  get hasErrorOccured() {
    return this.userFacadeService.userState$.pipe(
      switchMap((r) => {
        if (
          r.error !== undefined &&
          r.error === UserStoreErrorsEnum.CONNECT_ERROR
        ) {
          return of(true);
        }
        return of(false);
      })
    );
  }
}
