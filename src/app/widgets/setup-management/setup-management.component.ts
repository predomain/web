import { Store } from '@ngrx/store';
import { from, of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DomainFiltersModel,
  DomainMetadataModel,
} from 'src/app/models/domains';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import {
  PaymentModel,
  PaymentStateModel,
  PaymentTypesEnum,
} from 'src/app/models/states/payment-interfaces';
import { UserStateModel } from 'src/app/models/states/user-interfaces';
import { NonceTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { MiscUtilsService, WalletService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import { EnsMarketplaceService } from 'src/app/services/ens-marketplace';
import { PaymentFacadeService, UserFacadeService } from 'src/app/store/facades';

const globalAny: any = global;
const storeFrontHash = 'storefront.predomain.eth';

@Component({
  selector: 'app-setup-management',
  templateUrl: './setup-management.component.html',
  styleUrls: ['./setup-management.component.scss'],
})
export class SetupManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  overlaysCountOnInit = 0;
  step = 0;
  maxSteps = 2;
  closedByButton = false;
  setupName = false;
  setupShop = false;
  setupNameComplete = false;
  setupShopComplete = false;
  approvalSerial: string;
  userState: UserStateModel;
  paymentState: PaymentStateModel;
  userName: DomainMetadataModel;
  userNamesData: DomainMetadataModel[];
  userNames: any;
  setupDomainForm: FormGroup;
  setupShopToCheck: PaymentModel;
  setupNameToCheck: PaymentModel;
  setupNameSubscription;
  setupShopSubscription;
  shopSetupStatusSubscription;
  nameSetupStatusSubscription;
  paymentStateSubscription;
  userStateSubscription;

  constructor(
    protected userFacade: UserFacadeService,
    protected walletService: WalletService,
    protected paymentFacade: PaymentFacadeService,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected snackBar: MatSnackBar,
    protected miscUtilsService: MiscUtilsService,
    protected ensService: EnsService,
    protected store: Store<PaymentStateModel>,
    public genericDialogRef: MatDialogRef<SetupManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.setupDomainForm = new FormGroup({
      domain: new FormControl(''),
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
          this.checkShopsSetup();
          this.checkNameSetup();
        })
      )
      .subscribe();
  }

  setShop(name: string, nameId: string, shopHash: string) {
    if (this.setupShopSubscription) {
      this.setupShopSubscription.unsubscribe();
    }
    this.setupShop = true;
    const provider = globalAny.canvasProvider;
    const userAddress = this.userState.user.walletAddress;
    let resolver;
    this.setupShopSubscription = from(provider.getResolver(name))
      .pipe(
        switchMap((r) => {
          if (r === null || r === false) {
            throw false;
          }
          resolver = (r as any).address;
          return this.ensService.getDomainContentHashPure(
            provider,
            storeFrontHash
          );
        }),
        switchMap((r) => {
          if (r === null || r === false) {
            throw false;
          }
          const hash = r as string;
          return this.ensMarketplaceService.setContentHash(
            nameId,
            hash,
            resolver,
            userAddress,
            provider
          );
        }),
        switchMap((transferDataAndGas: any) => {
          if (transferDataAndGas === false) {
            throw 1;
          }
          const [renewData, gasLimit] = transferDataAndGas;
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          this.approvalSerial = serial;
          const p = {
            id: serial,
            paymentMarketAddress: resolver,
            paymentExchangeRate: this.paymentState.ethUsdPrice,
            paymentPayer: userAddress,
            paymentCurrency: 'ETH',
            paymentPayee: userAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_SET_ENS_CONTENT_HASH,
            paymentAbstractBytesSlot: renewData,
            paymentTotal: '0x0',
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
          this.setupShop = false;
        }
      });
  }

  setProfileName(name: string) {
    if (this.setupNameSubscription) {
      this.setupNameSubscription.unsubscribe();
    }
    this.setupName = true;
    const provider = globalAny.canvasProvider;
    const userAddress = this.userState.user.walletAddress;
    this.setupNameSubscription = from(name)
      .pipe(
        switchMap((r) => {
          return this.ensMarketplaceService.setProfileName(
            name,
            userAddress,
            provider
          );
        }),
        switchMap((transferDataAndGas: any) => {
          if (transferDataAndGas === false) {
            throw 1;
          }
          const [renewData, gasLimit] = transferDataAndGas;
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          this.approvalSerial = serial;
          const p = {
            id: serial,
            paymentMarketAddress:
              this.ensMarketplaceService.ensReverseRegistryContractAddress,
            paymentExchangeRate: this.paymentState.ethUsdPrice,
            paymentPayer: userAddress,
            paymentCurrency: 'ETH',
            paymentPayee: userAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_SET_ENS_NAME,
            paymentAbstractBytesSlot: renewData,
            paymentTotal: '0x0',
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
          this.setupName = false;
        }
      });
  }

  checkShopsSetup() {
    if (this.shopSetupStatusSubscription) {
      return;
    }
    const hasSetupResolved = new Subject<boolean>();
    this.shopSetupStatusSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasSetupResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingPayments = [];
          if (this.setupShopComplete === true) {
            return;
          }
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.setupShopToCheck !== undefined &&
              payment.paymentSerial === this.setupShopToCheck.paymentSerial
            ) {
              pendingPayments.push(payment);
              break;
            }
            if (
              payment.paymentType ===
                PaymentTypesEnum.TX_SET_ENS_CONTENT_HASH &&
              payment.paymentStatus === false
            ) {
              pendingPayments.push(payment);
            }
          }
          this.setupShopToCheck = pendingPayments[pendingPayments.length - 1];
          if (paymentState.paymentCancelled === true) {
            this.setupShop = false;
            this.shopSetupStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            pendingPayments[pendingPayments.length - 1].paymentStatus === true
          ) {
            this.setupShopComplete = true;
            this.setupShop = false;
            this.shopSetupStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            this.setupShopToCheck === undefined
          ) {
            this.setupShop = true;
            this.setupShopToCheck = pendingPayments[pendingPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  checkNameSetup() {
    if (this.nameSetupStatusSubscription) {
      return;
    }
    const hasSetupResolved = new Subject<boolean>();
    this.nameSetupStatusSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasSetupResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingPayments = [];
          if (this.step > 1) {
            return;
          }
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.setupNameToCheck !== undefined &&
              payment.paymentSerial === this.setupNameToCheck.paymentSerial
            ) {
              pendingPayments.push(payment);
              break;
            }
            if (
              payment.paymentType === PaymentTypesEnum.TX_SET_ENS_NAME &&
              payment.paymentStatus === false
            ) {
              pendingPayments.push(payment);
            }
          }
          this.setupNameToCheck = pendingPayments[pendingPayments.length - 1];
          if (paymentState.paymentCancelled === true) {
            this.setupName = false;
            this.step++;
            this.userName = this.userNamesData.filter(
              (d) =>
                (d.labelName =
                  this.setupDomainForm.controls.domain.value.split('.eth')[0])
            )[0];
            this.nameSetupStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            pendingPayments[pendingPayments.length - 1].paymentStatus === true
          ) {
            this.step++;
            this.userName = this.userNamesData.filter(
              (d) =>
                (d.labelName =
                  this.setupDomainForm.controls.domain.value.split('.eth')[0])
            )[0];
            this.setupNameComplete = true;
            this.setupName = false;
            this.nameSetupStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            this.setupNameToCheck === undefined
          ) {
            this.step++;
            this.userName = this.userNamesData.filter(
              (d) =>
                (d.labelName =
                  this.setupDomainForm.controls.domain.value.split('.eth')[0])
            )[0];
            this.setupName = true;
            this.setupNameToCheck = pendingPayments[pendingPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  performStoreSetup() {
    this.setShop(this.userName.labelName + '.eth', this.userName.id, '');
  }

  performNameSetup() {
    if (this.setupDomainForm.controls.domain.value === '') {
      return;
    }
    this.setProfileName(this.setupDomainForm.controls.domain.value);
  }

  checkIfNameIsSet() {
    if (this.userName !== undefined) {
      this.step = 2;
      return;
    }
    this.step++;
  }

  pretty(name: string) {
    return this.ensService.prettify(name);
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

  get quickSearchKeysToChunk() {
    if (
      this.userNames === undefined ||
      this.setupDomainForm.controls.domain.value === '' ||
      this.setupDomainForm.controls.domain.value.length < 3
    ) {
      return [];
    }
    const name = this.setupDomainForm.controls.domain.value;
    const nameFirstChar = name[0];
    const nameSecondChar = name[1];
    if (
      nameFirstChar in this.userNames === true &&
      nameSecondChar in this.userNames[nameFirstChar] === true
    ) {
      return this.userNames[nameFirstChar][nameSecondChar].filter((d) =>
        this.ensService.extraFiltersPure(
          d,
          {
            alphabet: false,
            numbers: false,
            emoji: false,
            palindrome: false,
            prepunk: false,
            repeating: false,
          } as DomainFiltersModel,
          {
            contains: { value: this.setupDomainForm.controls.domain.value },
            minLength: { value: 0 },
            maxLength: { value: 100 },
          },
          0,
          0
        )
      );
    }
    return [];
  }
}
