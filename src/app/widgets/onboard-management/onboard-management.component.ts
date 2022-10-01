import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { BlockExplorersEnum, ENSContracts } from 'src/app/configurations';
import { DomainMetadataModel } from 'src/app/models/domains';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import {
  PaymentModel,
  PaymentStateModel,
  PaymentTypesEnum,
} from 'src/app/models/states/payment-interfaces';
import { UserStateModel } from 'src/app/models/states/user-interfaces';
import { NonceTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { CheckoutServicesService } from 'src/app/pages/checkout/checkout-services/checkout-services.service';
import { UserService, WalletService } from 'src/app/services';
import { EnsMarketplaceService } from 'src/app/services/ens-marketplace';
import { PaymentFacadeService, UserFacadeService } from 'src/app/store/facades';
import { environment } from 'src/environments/environment';

const globalAny: any = global;

@Component({
  selector: 'app-onboard-management',
  templateUrl: './onboard-management.component.html',
  styleUrls: ['./onboard-management.component.scss'],
})
export class OnboardManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  step = 0;
  domainsSelectedTransfer;
  domainsTransferTo;
  userState: UserStateModel;
  paymentState: PaymentStateModel;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  approvalToCheck: PaymentModel;
  transferToCheck: PaymentModel;
  transferForm: FormGroup;
  approving = false;
  transfering = false;
  transferComplete = false;
  closedByButton = false;
  resolvingReceiverAddress = true;
  overlaysCountOnInit = 0;
  maxSteps = 2;
  resolveRegistrantInputTimer;
  approvalSerial;
  userStateSubscription;
  paymentStateSubscription;
  approveSubscription;
  transferSubscription;
  approvalStatusCheckSubscription;
  transferStatusCheckSubscription;
  resolveRegistrantAddressSubscription;

  constructor(
    protected userFacade: UserFacadeService,
    protected walletService: WalletService,
    protected paymentFacade: PaymentFacadeService,
    protected userService: UserService,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected snackBar: MatSnackBar,
    protected store: Store<PaymentStateModel>,
    public checkoutService: CheckoutServicesService,
    public genericDialogRef: MatDialogRef<OnboardManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.transferForm = new FormGroup({
      to: new FormControl(this.domainsTransferTo),
      toEthName: new FormControl(null),
    });
  }

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
    this.approvalStatusCheckSubscription.unsubscribe();
    this.userStateSubscription.unsubscribe();
    this.paymentStateSubscription.unsubscribe();
    if (this.transferStatusCheckSubscription) {
      this.transferStatusCheckSubscription.unsubscribe();
    }
    if (this.transferSubscription) {
      this.transferSubscription.unsubscribe();
    }
    if (this.approveSubscription) {
      this.approveSubscription.unsubscribe();
    }
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
          this.checkApprovalStatus();
          this.checkTransferStatus();
        })
      )
      .subscribe();
  }

  approve() {
    if (this.approveSubscription) {
      this.approveSubscription.unsubscribe();
    }
    this.approving = true;
    const userAddress = this.userState.user.walletAddress;
    this.approveSubscription = this.ensMarketplaceService
      .approve(
        this.ensMarketplaceService.marketplaceContractAddress,
        userAddress,
        true,
        globalAny.canvasProvider
      )
      .pipe(
        switchMap((approveDataAndGas: any) => {
          if (approveDataAndGas === false) {
            throw 1;
          }
          const [approveData, gasLimit] = approveDataAndGas;
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          this.approvalSerial = serial;
          const p = {
            id: serial,
            paymentMarketAddress: ENSContracts.token,
            paymentExchangeRate: this.paymentState.ethUsdPrice,
            paymentPayer: userAddress,
            paymentCurrency: 'ETH',
            paymentPayee: this.ensMarketplaceService.marketplaceContractAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_APPROVAL,
            paymentAbstractBytesSlot: approveData,
            paymentTotal: '0',
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
          this.approving = false;
        }
      });
  }

  checkApprovalStatus() {
    if (this.approvalStatusCheckSubscription) {
      return;
    }
    const hasApprovalResolved = new Subject<boolean>();
    this.approvalStatusCheckSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasApprovalResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingApprovalPayments = [];
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.approvalToCheck !== undefined &&
              payment.paymentSerial === this.approvalToCheck.paymentSerial
            ) {
              pendingApprovalPayments.push(payment);
              break;
            }
            if (
              payment.paymentType === PaymentTypesEnum.TX_APPROVAL &&
              payment.paymentStatus === false
            ) {
              pendingApprovalPayments.push(payment);
            }
          }
          if (paymentState.paymentCancelled === true) {
            this.approving = false;
            this.approvalStatusCheckSubscription = undefined;
            hasApprovalResolved.next(false);
            return;
          }
          if (
            pendingApprovalPayments.length > 0 &&
            pendingApprovalPayments[pendingApprovalPayments.length - 1]
              .paymentStatus === true
          ) {
            this.approving = false;
            this.approvalStatusCheckSubscription = undefined;
            hasApprovalResolved.next(false);
            this.nextStep();
            return;
          }
          if (
            pendingApprovalPayments.length > 0 &&
            this.approvalToCheck === undefined
          ) {
            this.approving = true;
            this.approvalToCheck =
              pendingApprovalPayments[pendingApprovalPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  goToEtherscan(address: string) {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + '/address/' + address,
      '_blank'
    );
  }

  transferDomains(
    domainsToTransfer: DomainMetadataModel[],
    transferTo: string
  ) {
    if (this.transferSubscription) {
      this.transferSubscription.unsubscribe();
    }
    this.transfering = true;
    const userAddress = this.userState.user.walletAddress;
    const domainNames = domainsToTransfer.map((d) => d.labelName);
    this.transferSubscription = this.ensMarketplaceService
      .transfer(domainNames, transferTo, userAddress, globalAny.canvasProvider)
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
            paymentPayee: transferTo,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_TRANSFER,
            paymentAbstractBytesSlot: transferData,
            paymentTotal: '0',
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

  checkTransferStatus() {
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
          this.transferToCheck =
            pendingTransferPayments[pendingTransferPayments.length - 1];
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

  resolveRegistrantAddressInput() {
    if (this.transferForm.controls.toEthName.value === '') {
      this.resolvingReceiverAddress = true;
      this.transferForm.controls.to.setValue(false);
      return;
    }
    if (this.resolveRegistrantInputTimer !== undefined) {
      clearTimeout(this.resolveRegistrantInputTimer);
    }
    this.resolvingReceiverAddress = false;
    this.resolveRegistrantInputTimer = setTimeout(() => {
      this.resolveRegistrantAddressSubscription = this.userService
        .getEthAddress(
          globalAny.canvasProvider,
          this.transferForm.controls.toEthName.value
        )
        .pipe(
          map((r) => {
            this.resolvingReceiverAddress = true;
            if (r === null || r === false) {
              this.domainsTransferTo = undefined;
              this.transferForm.controls.to.setValue(false);
              return;
            }
            this.domainsTransferTo = r;
            this.transferForm.controls.to.setValue(r);
          })
        )
        .subscribe();
    }, 1000);
  }

  goToPendingTx() {
    window.open(
      BlockExplorersEnum[environment.defaultChain] +
        '/tx/' +
        this.transferToCheck.paymentHash,
      '_blank'
    );
  }

  performTransfer() {
    this.transferDomains(this.domainsSelectedTransfer, this.domainsTransferTo);
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

  resetRegistrantInput() {
    this.transferForm.controls.toEthName.setValue('');
  }

  get transferTo() {
    return this.transferForm.controls.toEthName.value;
  }

  get ensMarketplaceContract() {
    return this.ensMarketplaceService.marketplaceContractAddress;
  }
}
