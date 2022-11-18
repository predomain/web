import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { from, of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import {
  DomainFiltersModel,
  DomainMetadataModel,
  FeaturedDomainsModel,
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
const featureKey = 'predomain_featured';

@Component({
  selector: 'app-featured-management',
  templateUrl: './featured-management.component.html',
  styleUrls: ['./featured-management.component.scss'],
})
export class FeaturedManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  step = 0;
  maxSteps = 2;
  userState: UserStateModel;
  paymentState: PaymentStateModel;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  closedByButton = false;
  overlaysCountOnInit = 0;
  userDomains: DomainMetadataModel[] = [];
  features: FeaturedDomainsModel = { order: [], featured: {} };
  userNames: any;
  userName: DomainMetadataModel;
  editFormId = null;
  editFeatureFormId = null;
  editStates = {};
  titleEditStates = {};
  nameNotFound = false;
  updatingFeatured = false;
  updatingFeaturedComplete = false;
  setupDomainForm: FormGroup;
  approvalSerial;
  updatingFeaturedCheck;
  userStateSubscription;
  paymentStateSubscription;
  updateFeaturedSubscription;
  updateFeaturedStatusSubscription;

  constructor(
    protected userFacade: UserFacadeService,
    protected walletService: WalletService,
    protected paymentFacade: PaymentFacadeService,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected snackBar: MatSnackBar,
    protected ensService: EnsService,
    protected miscUtilsService: MiscUtilsService,
    protected store: Store<PaymentStateModel>,
    public genericDialogRef: MatDialogRef<FeaturedManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.setupDomainForm = new FormGroup({
      domain: new FormControl(''),
      title: new FormControl(''),
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
    this.initEditStates();
    this.subscribeToUserState();
    this.subscribeToPaymentState();
  }

  ngOnDestroy(): void {
    this.userStateSubscription.unsubscribe();
    this.paymentStateSubscription.unsubscribe();
  }

  initEditStates(state = false) {
    Object.keys(this.features.featured).map((f) => {
      this.editStates[f] = {};
      this.features.featured[f].map((n) => {
        this.editStates[f][n.labelName] = state;
      });
    });
    Object.keys(this.features.featured).map((f) => {
      this.titleEditStates[f] = state;
    });
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
          this.checkSaveStatus();
        })
      )
      .subscribe();
  }

  updateFeatured(name: string, nameId: string) {
    if (this.updateFeaturedSubscription) {
      this.updateFeaturedSubscription.unsubscribe();
    }
    this.updatingFeatured = true;
    const provider = globalAny.canvasProvider;
    const userAddress = this.userState.user.walletAddress;
    let resolver;
    this.updateFeaturedSubscription = from(provider.getResolver(name))
      .pipe(
        switchMap((r) => {
          if (r === null || r === false) {
            throw false;
          }
          resolver = (r as any).address;
          const hash = r as string;
          return this.ensMarketplaceService.setText(
            nameId,
            featureKey,
            JSON.stringify(this.processFeatureSnapshot()),
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
            paymentType: PaymentTypesEnum.TX_SET_ENS_TEXT,
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
          this.updatingFeatured = false;
        }
      });
  }

  checkSaveStatus() {
    if (this.updateFeaturedStatusSubscription) {
      return;
    }
    const hasSetupResolved = new Subject<boolean>();
    this.updateFeaturedStatusSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasSetupResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingPayments = [];
          if (this.updatingFeaturedComplete === true) {
            return;
          }
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.updatingFeaturedCheck !== undefined &&
              payment.paymentSerial === this.updatingFeaturedCheck.paymentSerial
            ) {
              pendingPayments.push(payment);
              break;
            }
            if (
              payment.paymentType === PaymentTypesEnum.TX_SET_ENS_TEXT &&
              payment.paymentStatus === false
            ) {
              pendingPayments.push(payment);
            }
          }
          this.updatingFeaturedCheck =
            pendingPayments[pendingPayments.length - 1];
          if (paymentState.paymentCancelled === true) {
            this.updatingFeatured = false;
            this.updateFeaturedStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            pendingPayments[pendingPayments.length - 1].paymentStatus === true
          ) {
            this.updatingFeaturedComplete = true;
            this.updatingFeatured = false;
            this.updateFeaturedStatusSubscription = undefined;
            hasSetupResolved.next(false);
            return;
          }
          if (
            pendingPayments.length > 0 &&
            this.updatingFeaturedCheck === undefined
          ) {
            this.updatingFeatured = true;
            this.updatingFeaturedCheck =
              pendingPayments[pendingPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  performSave() {
    this.updateFeatured(this.userName.labelName + '.eth', this.userName.id);
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

  processFeatureSnapshot() {
    const newFeatureTags = Object.keys(this.features.featured);
    const newFeatureItems = {};
    let tagId = 0;
    Object.keys(this.features.featured).map((f) => {
      let dPos = 0;
      this.features.featured[f].map((d) => {
        if (Object.keys(newFeatureItems).includes(d.labelName) === false) {
          newFeatureItems[d.labelName] = [tagId + '_' + dPos];
        } else {
          newFeatureItems[d.labelName].push(tagId + '_' + dPos);
        }
        dPos++;
      });
      tagId++;
    });
    const newFeatures = {
      order: this.features.order,
      items: newFeatureItems,
      tags: newFeatureTags,
    };
    return newFeatures;
  }

  moveFeatureDown(feature: string) {
    const arrayPosition = this.features.order.indexOf(feature);
    this.miscUtilsService.moveArray(
      this.features.order,
      arrayPosition,
      arrayPosition + 1
    );
  }

  moveFeatureUp(feature: string) {
    const arrayPosition = this.features.order.indexOf(feature);
    this.miscUtilsService.moveArray(
      this.features.order,
      arrayPosition,
      arrayPosition - 1
    );
  }

  removeName(feature: string, id: number, name: string) {
    this.features.featured[feature].splice(id, 1);
  }

  removeFeature(feature: string) {
    this.features.order.splice(this.features.order.indexOf(feature), 1);
    delete this.features.featured[feature];
  }

  addFeature() {
    this.step = Object.keys(this.features.featured).length;
    let featureNameSuffix = Object.keys(this.features.featured).length + 1;
    while ('Feature ' + featureNameSuffix in this.features.featured) {
      featureNameSuffix++;
    }
    this.features.featured['Feature ' + featureNameSuffix] = [];
    this.features.order.push('Feature ' + featureNameSuffix);
    this.initEditStates();
  }

  addName(feature: string) {
    this.features.featured[feature].push(
      this.userDomains[Math.floor(Math.random() * this.userDomains.length)]
    );
    this.initEditStates();
  }

  rearrangeNames(event: CdkDragDrop<any[]>, feature: string) {
    moveItemInArray(
      this.features.featured[feature],
      event.previousIndex,
      event.currentIndex
    );
  }

  pretty(name: string) {
    return this.ensService.prettify(name);
  }

  getFeatureItems(feature: string) {
    return this.features.featured[feature];
  }

  setFeatureTitleData(feature: string, newFeature: string) {
    if (Object.keys(this.features.featured).includes(newFeature) === true) {
      this.editStates[feature] = false;
      return;
    }
    this.features.featured[newFeature] = this.features.featured[feature];
    this.features.order.splice(
      this.features.order.indexOf(feature),
      1,
      newFeature
    );
    this.editStates[newFeature] = this.editStates[feature];
    delete this.features.featured[feature];
  }

  setFeatureItemData(name: any) {
    let nameValue = name;
    if (typeof name !== 'string') {
      nameValue = name.target.value;
    }
    if (this.userDomains.filter((d) => d.labelName === nameValue).length <= 0) {
      this.nameNotFound = true;
      return;
    }
    this.nameNotFound = false;
    this.features.featured[this.editFeatureFormId][this.editFormId] =
      this.userDomains.filter((d) => d.labelName === nameValue)[0];
    this.editStates[this.editFeatureFormId][nameValue] = true;
  }

  getEditState(feature: string, name: string) {
    return this.editStates[feature][name];
  }

  toggleEditState(feature: string, id: number, name: string) {
    if (this.editStates[feature][name] === true) {
      this.editFormId = null;
      this.editFeatureFormId = null;
      this.editStates[feature][name] = false;
    } else {
      this.nameNotFound = false;
      this.initEditStates();
      this.setupDomainForm.controls.domain.setValue(
        this.features.featured[feature][id].labelName + '.eth'
      );
      this.editFormId = id;
      this.editFeatureFormId = feature;
      this.editStates[feature][name] = true;
    }
  }

  getTitleEditState(feature: string) {
    return this.titleEditStates[feature];
  }

  toggleTitleEditState(feature: string) {
    if (this.titleEditStates[feature] === true) {
      this.setFeatureTitleData(
        feature,
        this.setupDomainForm.controls.title.value
      );
      this.titleEditStates[this.setupDomainForm.controls.title.value] = false;
    } else {
      this.initEditStates();
      this.setupDomainForm.controls.title.setValue(feature);
      this.titleEditStates[feature] = !this.titleEditStates[feature];
    }
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

  isFeatureNameInConflict(feature: string, id: number) {
    return (
      Object.keys(this.features.featured).includes(feature) &&
      Object.keys(this.features.featured).indexOf(feature) !== id
    );
  }

  get orderFeatureList() {
    return this.features.order;
  }

  get featureNames() {
    return Object.keys(this.features.featured);
  }

  get featureNamesCount() {
    return Object.keys(this.features.featured).length;
  }
}
