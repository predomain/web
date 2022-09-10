import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BigNumber, ethers } from 'ethers';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ENSContracts, generalConfigurations } from 'src/app/configurations';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import {
  ENSRegistrationCommmitmentRequestResultModel,
  ENSRegistrationStepsEnum,
} from 'src/app/models/states/ens-registration-interfaces';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import {
  PaymentModel,
  PaymentStateModel,
  PaymentTypesEnum,
} from 'src/app/models/states/payment-interfaces';
import { NonceTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { MiscUtilsService, WalletService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import { RegistrationFacilityService } from 'src/app/services/registration';
import {
  ENSRegistrationFacadeService,
  PaymentFacadeService,
} from 'src/app/store/facades';
import { GenericDialogComponent } from 'src/app/widgets/generic-dialog';
import { environment } from 'src/environments/environment';

const globalAny: any = global;

export interface AssetRegistrationStatusModel {
  trackedPayment?: PaymentModel;
  status: ENSRegistrationStepsEnum;
}

@Injectable({
  providedIn: 'root',
})
export class CheckoutServicesService {
  constructor(
    protected registrationFacilityService: RegistrationFacilityService,
    protected miscUtilsService: MiscUtilsService,
    protected registrationFacade: ENSRegistrationFacadeService,
    protected ensService: EnsService,
    protected walletService: WalletService,
    protected paymentFacade: PaymentFacadeService,
    protected snackBar: MatSnackBar,
    protected dialog: MatDialog
  ) {}

  assessRegistrationStatus(
    registrationStatus: ENSRegistrationStepsEnum,
    paymentStateNow: PaymentStateModel
  ) {
    const payments = paymentStateNow.entities;
    let pending, fulFilled, currentStatus;
    pending = [];
    fulFilled = [];
    if (Object.keys(payments).length > 0) {
      pending = Object.keys(payments).filter(
        (p) =>
          (payments[p].paymentType === PaymentTypesEnum.COMMIT ||
            payments[p].paymentType === PaymentTypesEnum.REGISTER) &&
          payments[p].paymentStatus === false &&
          payments[p].paymentHash !== '' &&
          payments[p].paymentHash !== undefined &&
          payments[p].paymentHash !== null &&
          (payments[p].archived === undefined || payments[p].archived === false)
      );
      fulFilled = Object.keys(payments).filter(
        (p) =>
          (payments[p].paymentType === PaymentTypesEnum.COMMIT ||
            payments[p].paymentType === PaymentTypesEnum.REGISTER) &&
          payments[p].paymentStatus === true &&
          payments[p].paymentHash !== '' &&
          payments[p].paymentHash !== undefined &&
          payments[p].paymentHash !== null &&
          (payments[p].archived === undefined || payments[p].archived === false)
      );
    }
    if (pending.length <= 0 && fulFilled.length <= 0) {
      currentStatus = {
        status: ENSRegistrationStepsEnum.BEFORE_COMMIT,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    if (
      fulFilled.length > 1 &&
      payments[fulFilled[fulFilled.length - 1]].paymentStatus === true &&
      payments[fulFilled[fulFilled.length - 1]].paymentType ===
        PaymentTypesEnum.REGISTER &&
      (registrationStatus === ENSRegistrationStepsEnum.REGISTRATION_SENT ||
        registrationStatus === ENSRegistrationStepsEnum.BEFORE_COMMIT)
    ) {
      const payerAddressEth =
        payments[fulFilled[fulFilled.length - 1]]?.paymentPayerEthName;
      const commitPayment = payments[fulFilled[fulFilled.length - 2]];
      this.showRegitrationCompletionDialog(
        payerAddressEth !== undefined
          ? payerAddressEth
          : commitPayment.paymentRawRecord[0].owner
      );
      this.paymentFacade.archiveAllPayment();
      this.registrationFacade.removeAllRegistrations();
      currentStatus = {
        status: ENSRegistrationStepsEnum.REGISTRATION_COMPLETE,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    if (
      pending.length > 0 &&
      payments[pending[pending.length - 1]].paymentStatus === false &&
      payments[pending[pending.length - 1]].paymentType ===
        PaymentTypesEnum.REGISTER &&
      registrationStatus === ENSRegistrationStepsEnum.BEFORE_REGISTRATION
    ) {
      currentStatus = {
        trackedPayment: payments[fulFilled[fulFilled.length - 1]],
        status: ENSRegistrationStepsEnum.REGISTRATION_SENT,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    if (
      registrationStatus == ENSRegistrationStepsEnum.AWAIT &&
      payments[fulFilled[fulFilled.length - 1]].paymentType ===
        PaymentTypesEnum.COMMIT &&
      this.timeToWait(payments[fulFilled[fulFilled.length - 1]].paymentDate) >
        100
    ) {
      currentStatus = {
        status: ENSRegistrationStepsEnum.BEFORE_REGISTRATION,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    if (
      fulFilled.length > 0 &&
      payments[fulFilled[fulFilled.length - 1]].paymentType ===
        PaymentTypesEnum.COMMIT &&
      payments[fulFilled[fulFilled.length - 1]].paymentStatus === true &&
      (registrationStatus === ENSRegistrationStepsEnum.COMMIT_SENT ||
        registrationStatus === ENSRegistrationStepsEnum.BEFORE_COMMIT)
    ) {
      currentStatus = {
        trackedPayment: payments[fulFilled[fulFilled.length - 1]],
        status: ENSRegistrationStepsEnum.AWAIT,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    if (
      pending.length > 0 &&
      payments[pending[pending.length - 1]].paymentType ===
        PaymentTypesEnum.COMMIT &&
      payments[pending[pending.length - 1]].paymentStatus === false &&
      registrationStatus === ENSRegistrationStepsEnum.BEFORE_COMMIT
    ) {
      currentStatus = {
        trackedPayment: payments[pending[pending.length - 1]],
        status: ENSRegistrationStepsEnum.COMMIT_SENT,
      } as AssetRegistrationStatusModel;
      return currentStatus;
    }
    return currentStatus;
  }

  showCartEmptyDialog() {
    setTimeout(() => {
      const dialogRef = this.dialog.open(GenericDialogComponent, {
        data: {
          titleText: 'REGISTRATION.BASKET_EMPTY',
          subText: 'REGISTRATION.PLEASE_SELECT_DOMAINS_TO_REGISTER',
          showSpinner: true,
          lightColour: false,
          spinnerSize: 200,
          customIcon: 'cart_empty',
          textAlign: 'center',
          buttonTitle: 'BUTTON.GO_TO_HOME',
          buttonLink: 'home',
          buttonLinkPageRef: PagesEnum.HOME,
          goToOnExit: 'home',
          goToOnExitPage: PagesEnum.HOME,
        },
        panelClass: 'cos-generic-dialog',
      });
    }, 750);
  }

  showRegitrationCompletionDialog(address: string) {
    setTimeout(() => {
      const dialogRef = this.dialog.open(GenericDialogComponent, {
        data: {
          titleText: 'REGISTRATION.REGISTRATION_COMPLETE_TITLE',
          subText: 'REGISTRATION.YOUR_DOMAINS_HAVE_NOW_BEEN_REGISTERED',
          showSpinner: true,
          lightColour: false,
          spinnerSize: 200,
          customIcon: 'check',
          textAlign: 'center',
          buttonTitle: 'BUTTON.CHECK_DOMAINS',
          buttonLink: 'profile/' + address,
          buttonLinkPageRef: PagesEnum.PROFILE,
          goToOnExit: 'home',
          goToOnExitPage: PagesEnum.HOME,
        },
        panelClass: 'cos-generic-dialog',
      });
    }, 750);
  }

  asessRegistrationStageAction(
    registrationStatus: ENSRegistrationStepsEnum,
    methods: {
      commitRegistrationMethod: any;
      completeRegistrationMethod: any;
    }
  ) {
    if (registrationStatus === undefined) {
      return null;
    }
    switch (registrationStatus) {
      case ENSRegistrationStepsEnum.BEFORE_COMMIT:
        {
          return methods.commitRegistrationMethod;
        }
        break;
      case ENSRegistrationStepsEnum.COMMIT_SENT:
        {
          return null;
        }
        break;
      case ENSRegistrationStepsEnum.COMMIT_COMPLETE:
        {
          return null;
        }
        break;
      case ENSRegistrationStepsEnum.AWAIT:
        {
          return null;
        }
        break;
      case ENSRegistrationStepsEnum.BEFORE_REGISTRATION:
        {
          return methods.completeRegistrationMethod;
        }
        break;
      case ENSRegistrationStepsEnum.REGISTRATION_SENT:
        {
          return null;
        }
        break;
    }
  }

  commitRegistration(
    domains: ENSDomainMetadataModel[],
    payer: string,
    registrant: string,
    resolverSet: boolean,
    duration: number,
    ethUsdPrice: string,
    ownerEthName: string
  ) {
    const secret =
      '0x' +
      this.miscUtilsService.toHex(
        this.walletService.produceNonce(NonceTypesEnum.TOKEN)
      );
    const ensResolver =
      environment.test === true
        ? ENSContracts.resolverTestnet
        : ENSContracts.resolver;
    const compiledPacket =
      this.registrationFacilityService.registrationDomainsToCommitmentPacket(
        registrant,
        duration,
        secret,
        resolverSet === true ? ensResolver : ENSContracts.nullResolver,
        domains
      );
    return this.registrationFacilityService
      .createRegistrationCommitmentPacket(
        compiledPacket,
        payer,
        globalAny.canvasProvider
      )
      .pipe(
        switchMap((commitmentPacketAndGas: any) => {
          if (commitmentPacketAndGas === false) {
            throw 1;
          }
          const [commitmentPacket, gasLimit] = commitmentPacketAndGas;
          const registrationPriceRanges = (
            commitmentPacket as ENSRegistrationCommmitmentRequestResultModel
          ).priceRanges;
          const requestRegistrationData =
            this.registrationFacilityService.createRegistrationRequestPaymentPacket(
              (commitmentPacket as ENSRegistrationCommmitmentRequestResultModel)
                .commitments,
              globalAny.canvasProvider
            );
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          const p = {
            id: serial,
            paymentMarketAddress:
              this.registrationFacilityService.bulkRegistrationContractAddress,
            paymentExchangeRate: ethUsdPrice,
            paymentPayer: payer,
            paymentCurrency: 'ETH',
            paymentPayee: registrant,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.COMMIT,
            paymentAbstractBytesSlot: requestRegistrationData,
            paymentTotal: '0',
            paymentStatus: false,
            paymentError: -1,
            paymentFee: '0',
            paymentGasLimit: gasLimit.toHexString(),
            paymentRawRecord: compiledPacket,
            paymentPriceRanges: registrationPriceRanges,
            paymentPayerEthName: ownerEthName,
          } as PaymentModel;
          this.paymentFacade.createPayment(p);
          return of(true);
        }),
        catchError((e) => {
          this.showErrorOnContractThrown();
          return of(false);
        })
      );
  }

  completeRegistration(
    commmitPayment: PaymentModel,
    payer: string,
    ethUsdPrice: string,
    ownerEthName: string
  ) {
    const commitedRegistration = commmitPayment;
    const rawRegistrationRecord = commitedRegistration.paymentRawRecord;
    const registrationsList = rawRegistrationRecord.map((d) => {
      return d.metadata;
    });
    const resolver = rawRegistrationRecord[0].resolver;
    const registrantAddress = rawRegistrationRecord[0].owner;
    const secret = rawRegistrationRecord[0].secret;
    const duration = rawRegistrationRecord[0].duration;
    const compiledPacket =
      this.registrationFacilityService.registrationDomainsToCommitmentPacket(
        registrantAddress,
        duration,
        secret,
        resolver,
        registrationsList
      );
    const finalTotal = registrationsList
      .map((d) => {
        const len = this.ensService.getNameLength(d.labelName);
        let price;
        const priceRanges = commmitPayment.paymentPriceRanges;
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
    return this.registrationFacilityService
      .completeRegistration(
        compiledPacket,
        payer,
        finalTotal.toHexString(),
        globalAny.canvasProvider
      )
      .pipe(
        switchMap((registrationPacketAndGasLimit: any) => {
          const minimumAcceptableGasCostPerRegistration =
            compiledPacket.length === 1
              ? ethers.BigNumber.from(170000)
              : ethers.BigNumber.from(110000).mul(compiledPacket.length);
          if (registrationPacketAndGasLimit === false) {
            throw 1;
          }
          const [registrationPacket, gasLimit] = registrationPacketAndGasLimit;
          if (
            (gasLimit as BigNumber).lt(minimumAcceptableGasCostPerRegistration)
          ) {
            throw 1;
          }
          const serial = this.walletService.produceNonce(NonceTypesEnum.SERIAL);
          const p = {
            id: serial,
            paymentMarketAddress:
              this.registrationFacilityService.bulkRegistrationContractAddress,
            paymentExchangeRate: ethUsdPrice,
            paymentPayer: payer,
            paymentCurrency: 'ETH',
            paymentPayee: registrantAddress,
            paymentSerial: serial,
            paymentDate: new Date().getTime(),
            paymentType: PaymentTypesEnum.REGISTER,
            paymentAbstractBytesSlot: registrationPacket,
            paymentTotal: finalTotal.toHexString(),
            paymentStatus: false,
            paymentGasLimit: gasLimit.toHexString(),
            paymentRawRecord: compiledPacket,
            paymentError: -1,
            paymentFee: '0',
            paymentPayerEthName: ownerEthName,
          } as PaymentModel;
          this.paymentFacade.createPayment(p);
          return of(true);
        }),
        catchError((e) => {
          this.showErrorOnContractThrown();
          return of(false);
        })
      );
  }

  calculateTotalInUsd(ethUsdPrice: string, totalCost: number) {
    return (parseFloat(ethUsdPrice) * totalCost).toFixed(2);
  }

  truncateResolvedAddress(address: string) {
    return address.substring(0, 30) + '...';
  }

  timeToWait(timeSince: number) {
    const dateNow = new Date().getTime();
    const timeToWait =
      Math.abs(
        parseInt((60000 - (dateNow - timeSince) / (60 / 100)).toString(), 10) -
          60000
      ) / 1030;
    return timeToWait;
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
}
