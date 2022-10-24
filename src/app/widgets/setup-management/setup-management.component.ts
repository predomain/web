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
import { BigNumber, ethers } from 'ethers';
import { from, of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { DomainMetadataModel } from 'src/app/models/domains';
import {
  RenewalDurationsEnum,
  RenewalDurationsTimeMultiplierEnum,
} from 'src/app/models/management';
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
import { environment } from 'src/environments/environment';
import { OnboardManagementComponent } from '../onboard-management';

const globalAny: any = global;
const YEARS_IN_SECONDS = 31556952;

@Component({
  selector: 'app-renew-management',
  templateUrl: './renew-management.component.html',
  styleUrls: ['./renew-management.component.scss'],
})
export class SetupManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  step = 0;
  domainsToRenew;
  renewalDuration: BigNumber;
  renewalDurationTypes: typeof RenewalDurationsEnum = RenewalDurationsEnum;
  userState: UserStateModel;
  paymentState: PaymentStateModel;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  renewToCheck: PaymentModel;
  renewForm: FormGroup;
  renewing = false;
  renewComplete = false;
  closedByButton = false;
  overlaysCountOnInit = 0;
  maxSteps = 2;
  approvalSerial;
  userStateSubscription;
  paymentStateSubscription;
  renewSubscription;
  renewStatusCheckSubscription;

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
  ) {
    this.renewForm = new FormGroup({
      duration: new FormControl(RenewalDurationsEnum['6MONTHS']),
    });
    this.setRenewalDuration(
      this.renewForm.controls.duration.value as RenewalDurationsEnum
    );
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
          this.checkRenewStatus();
        })
      )
      .subscribe();
  }

  setRenewalDuration(duration: RenewalDurationsEnum) {
    const durationMultiplier = ethers.BigNumber.from(
      RenewalDurationsTimeMultiplierEnum[duration] * 10000
    );
    this.renewalDuration = ethers.BigNumber.from(YEARS_IN_SECONDS)
      .mul(durationMultiplier)
      .div(10000);
  }

  performRenewalCostCalculation() {
    setTimeout(() => {
      this.setRenewalDuration(this.renewForm.controls.duration.value);
    }, 100);
  }

  renewDomains(domainsToRenew: DomainMetadataModel[], duration: BigNumber) {
    if (this.renewSubscription) {
      this.renewSubscription.unsubscribe();
    }
    this.renewing = true;
    const provider = globalAny.canvasProvider;
    const contract =
      this.ensMarketplaceService.getENSMarketplaceContract(provider);
    const userAddress = this.userState.user.walletAddress;
    const domainNames = domainsToRenew.map((d) => d.labelName);
    let finalTotal;
    this.renewSubscription = from(contract.getENSPriceRanges(duration))
      .pipe(
        switchMap((r) => {
          if (r === false || r === null) {
            throw 1;
          }
          const priceRanges = (r as string[]).map((p) => {
            return ethers.BigNumber.from(p)
              .mul(generalConfigurations.maxTotalCostBuffer)
              .div(100)
              .toHexString();
          });
          finalTotal = domainNames
            .map((d) => {
              const len = this.ensService.getNameLength(d);
              let price;
              switch (len) {
                case 3:
                  {
                    price = priceRanges[0];
                  }
                  break;
                case 4:
                  {
                    price = priceRanges[1];
                  }
                  break;
                default:
                  {
                    price = priceRanges[2];
                  }
                  break;
              }
              return ethers.BigNumber.from(price);
            })
            .reduce((a, b) => {
              return a.add(b);
            });
          return this.ensMarketplaceService.renew(
            domainNames,
            priceRanges,
            duration,
            userAddress,
            finalTotal.toHexString(),
            globalAny.canvasProvider
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
              this.ensMarketplaceService.marketplaceContractAddress,
            paymentExchangeRate: this.paymentState.ethUsdPrice,
            paymentPayer: userAddress,
            paymentCurrency: 'ETH',
            paymentPayee: userAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.TX_RENEW,
            paymentAbstractBytesSlot: renewData,
            paymentTotal: finalTotal.toHexString(),
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
          this.renewing = false;
        }
      });
  }

  checkRenewStatus() {
    if (this.renewStatusCheckSubscription) {
      return;
    }
    const hasRenewalResolved = new Subject<boolean>();
    this.renewStatusCheckSubscription = timer(0, 500)
      .pipe(
        takeUntil(hasRenewalResolved),
        switchMap((i) => {
          return this.paymentFacade.paymentState$;
        }),
        map((paymentState) => {
          const payments = paymentState.entities;
          const paymentIds = Object.keys(payments);
          const pendingRenewalPayments = [];
          for (const p of paymentIds) {
            const payment = payments[p];
            if (
              this.renewToCheck !== undefined &&
              payment.paymentSerial === this.renewToCheck.paymentSerial
            ) {
              pendingRenewalPayments.push(payment);
              break;
            }
            if (
              payment.paymentType === PaymentTypesEnum.TX_RENEW &&
              payment.paymentStatus === false
            ) {
              pendingRenewalPayments.push(payment);
            }
          }
          this.renewToCheck =
            pendingRenewalPayments[pendingRenewalPayments.length - 1];
          if (paymentState.paymentCancelled === true) {
            this.renewing = false;
            this.renewStatusCheckSubscription = undefined;
            hasRenewalResolved.next(false);
            return;
          }
          if (
            pendingRenewalPayments.length > 0 &&
            pendingRenewalPayments[pendingRenewalPayments.length - 1]
              .paymentStatus === true
          ) {
            this.renewComplete = true;
            this.renewing = false;
            this.renewStatusCheckSubscription = undefined;
            hasRenewalResolved.next(false);
            return;
          }
          if (
            pendingRenewalPayments.length > 0 &&
            this.renewToCheck === undefined
          ) {
            this.renewing = true;
            this.renewToCheck =
              pendingRenewalPayments[pendingRenewalPayments.length - 1];
          }
        })
      )
      .subscribe();
  }

  performRenewal() {
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
    if (domainNames.length === 1) {
      return this.ensService.calculateDomainsPrice(
        domainNames[0],
        this.paymentState.ethUsdPrice,
        duration.toNumber() / YEARS_IN_SECONDS
      );
    }
    const totalCost = domainNames
      .map((d) => {
        return this.ensService.calculateDomainsPrice(
          d,
          this.paymentState.ethUsdPrice,
          duration.toNumber() / YEARS_IN_SECONDS
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

  goToPendingTx() {
    window.open(
      BlockExplorersEnum[environment.defaultChain] +
        '/tx/' +
        this.renewToCheck.paymentHash,
      '_blank'
    );
  }

  get ensMarketplaceContract() {
    return this.ensMarketplaceService.marketplaceContractAddress;
  }

  get namesOfDomainsToRenew() {
    return this.domainsToRenew.map((d) => d.labelName);
  }
}
