import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { BigNumber, ethers } from 'ethers';
import { of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import {
  PaymentModel,
  PaymentStateModel,
  PaymentTypesEnum,
} from 'src/app/models/states/payment-interfaces';
import { UserStateModel } from 'src/app/models/states/user-interfaces';
import { NonceTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { WalletService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import { EnsMarketplaceService } from 'src/app/services/ens-marketplace';
import { PaymentFacadeService, UserFacadeService } from 'src/app/store/facades';
import { OnboardManagementComponent } from '../onboard-management';

const globalAny: any = global;
const YEARS_IN_SECONDS = 31556952;

@Component({
  selector: 'app-renew-management',
  templateUrl: './renew-management.component.html',
  styleUrls: ['./renew-management.component.scss'],
})
export class RenewManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  @Input() step = 0;
  @Input() domainsToRenew;
  @Input() renewalDuration: BigNumber;
  userState: UserStateModel;
  paymentState: PaymentStateModel;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  transferToCheck: PaymentModel;
  transfering = false;
  transferComplete = false;
  closedByButton = false;
  overlaysCountOnInit = 0;
  maxSteps = 2;
  approvalSerial;
  userStateSubscription;
  paymentStateSubscription;
  transferSubscription;
  transferStatusCheckSubscription;

  constructor(
    protected userFacade: UserFacadeService,
    protected walletService: WalletService,
    protected paymentFacade: PaymentFacadeService,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected snackBar: MatSnackBar,
    protected ensService: EnsService,
    protected store: Store<PaymentStateModel>,
    public genericDialogRef: MatDialogRef<OnboardManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  ngOnInit() {
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
    this.subscribeToUserState();
    this.subscribeToPaymentState();
  }

  ngOnDestroy(): void {
    this.userStateSubscription.unsubscribe();
    this.paymentStateSubscription.unsubscribe();
  }

  subscribeToUserState() {
    this.userStateSubscription = this.userFacade.userState$
      .pipe(
        map((s) => {
          this.userState = s;
          if (this.userState.user.walletAddress === undefined) {
            return;
          }
        })
      )
      .subscribe();
  }

  subscribeToPaymentState() {
    this.paymentStateSubscription = this.paymentFacade.paymentState$
      .pipe(
        map((s) => {
          this.paymentState = s;
          this.checkRenewStatus();
        })
      )
      .subscribe();
  }

  renewDomains(
    domainsToTransfer: ENSDomainMetadataModel[],
    duration: BigNumber
  ) {
    if (this.transferSubscription) {
      this.transferSubscription.unsubscribe();
    }
    this.transfering = true;
    const userAddress = this.userState.user.walletAddress;
    const domainNames = domainsToTransfer.map((d) => d.labelName);
    const totalCost = ethers.BigNumber.from(
      (this.getRenewalCost(domainNames, duration) * 10 ** 18).toString()
    ).toHexString();
    this.transferSubscription = this.ensMarketplaceService
      .renew(
        domainNames,
        duration,
        userAddress,
        totalCost,
        globalAny.canvasProvider
      )
      .pipe(
        switchMap((transferDataAndGas: any) => {
          if (transferDataAndGas === false) {
            throw 1;
          }
          const [transferData, gasLimit] = transferDataAndGas;
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          this.approvalSerial = serial;
          const p = {
            id: serial,
            paymentMarketAddress:
              this.ensMarketplaceService.marketplaceContractAddress,
            paymentExchangeRate: this.paymentState.ethUsdPrice,
            paymentPayer: userAddress,
            paymentCurrency: 'ETH',
            paymentPayee: userAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_RENEW,
            paymentAbstractBytesSlot: transferData,
            paymentTotal: totalCost,
            paymentStatus: false,
            paymentError: -1,
            paymentFee: '0',
            paymentGasLimit: gasLimit.toHexString(),
          } as PaymentModel;
          this.paymentFacade.createPayment(p);
          return of(true);
        }),
        catchError((e) => {
          this.showErrorOnContractThrown();
          return of(false);
        })
      )
      .subscribe((r) => {
        if (r === false) {
          this.transfering = false;
        }
      });
  }

  checkRenewStatus() {
    if (this.transferStatusCheckSubscription) {
      return;
    }
    const hasTransferResolved = new Subject<boolean>();
    this.transferStatusCheckSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasTransferResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingTransferPayments = [];
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.transferToCheck !== undefined &&
              payment.paymentSerial === this.transferToCheck.paymentSerial
            ) {
              pendingTransferPayments.push(payment);
              break;
            }
            if (
              payment.paymentType === PaymentTypesEnum.TX_TRANSFER &&
              payment.paymentStatus === false
            ) {
              pendingTransferPayments.push(payment);
            }
          }
          if (paymentState.paymentCancelled === true) {
            this.transfering = false;
            this.transferStatusCheckSubscription = undefined;
            hasTransferResolved.next(false);
            return;
          }
          if (
            pendingTransferPayments.length > 0 &&
            pendingTransferPayments[pendingTransferPayments.length - 1]
              .paymentStatus === true
          ) {
            this.transferComplete = true;
            this.transfering = false;
            this.transferStatusCheckSubscription = undefined;
            hasTransferResolved.next(false);
            this.nextStep();
            return;
          }
          if (
            pendingTransferPayments.length > 0 &&
            this.transferToCheck === undefined
          ) {
            this.transfering = true;
            this.transferToCheck =
              pendingTransferPayments[pendingTransferPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  performTransfer() {
    this.renewDomains(this.domainsToRenew, this.renewalDuration);
  }

  showErrorOnContractThrown() {
    this.snackBar.open(
      'An error has occured while preparing your transaction',
      'close',
      {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      }
    );
    return;
  }

  getRenewalCost(domainNames: string[], duration: BigNumber) {
    const totalCost = domainNames
      .map((d) => {
        return this.ensService.calculateDomainsPrice(
          d,
          this.paymentState.ethUsdPrice,
          YEARS_IN_SECONDS / duration.toNumber()
        );
      })
      .reduce((a, b) => {
        return a + b;
      });
    return totalCost;
  }

  nextStep() {
    if (this.step >= this.maxSteps) {
      return;
    }
    this.step++;
  }

  previousStep() {
    if (this.step === 0) {
      return;
    }
    this.step--;
  }

  setStep(nStep: number) {
    this.step = nStep;
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

  get ensMarketplaceContract() {
    return this.ensMarketplaceService.marketplaceContractAddress;
  }
}
