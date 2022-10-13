import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { BigNumber, ethers } from 'ethers';
import { of, timer } from 'rxjs';
import { delayWhen, map, retryWhen, switchMap, take } from 'rxjs/operators';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { DomainMetadataModel } from 'src/app/models/domains';
import { RenewalDurationsEnum } from 'src/app/models/management';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import {
  PaymentStateModel,
  PaymentTypesEnum,
} from 'src/app/models/states/payment-interfaces';
import { UserStateModel } from 'src/app/models/states/user-interfaces';
import { FormatTimePipe, TimeAgoPipe } from 'src/app/modules/pipes';
import { UserService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import { EnsMarketplaceService } from 'src/app/services/ens-marketplace';
import {
  PagesFacadeService,
  PaymentFacadeService,
  UserFacadeService,
} from 'src/app/store/facades';
import { OnboardManagementComponent } from 'src/app/widgets/onboard-management';
import { RenewManagementComponent } from 'src/app/widgets/renew-management';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';

const globalAny: any = global;
const EMPTY_DATA: DomainMetadataModel[] = [
  {
    id: null,
  },
];
export enum ManagementOperationEnum {
  TRANSFER,
  RENEW,
}

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ManageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('transferAllCheckbox') transferAllCheckbox: MatCheckbox;
  @ViewChild('renewAllCheckbox') renewAllCheckbox: MatCheckbox;
  starCount = new Array(3).fill(0);
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  displayedColumns: string[] = ['labelName', 'expiry', 'renew', 'transfer'];
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  dataSource = new MatTableDataSource<DomainMetadataModel>(EMPTY_DATA);
  managementOperationTypes: typeof ManagementOperationEnum =
    ManagementOperationEnum;
  domainsTransferred: string[] = [];
  renewalDuration = RenewalDurationsEnum['6MONTHS'];
  renewalDurationTypes: typeof RenewalDurationsEnum = RenewalDurationsEnum;
  hasPendingPayments = false;
  hasDomainsListLoaded = false;
  moreInfoEnabled = false;
  collapseAllItems = false;
  savingChangesInitiated = false;
  quickSearchForm: FormGroup;
  pendingTx: string;
  managementOperation: ManagementOperationEnum;
  selectedDomain: DomainMetadataModel;
  metadataForm: FormGroup;
  paymentState: PaymentStateModel;
  userState: UserStateModel;
  userDomains: DomainMetadataModel[];
  paymentStateSubscription;
  userStateSubscription;
  getUserDomainsSubscripton;
  saveChangesSubscripton;
  managementDialogSubscription;

  constructor(
    protected pagesFacade: PagesFacadeService,
    protected userFacade: UserFacadeService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected timeAgoService: TimeAgoPipe,
    protected formatTimeService: FormatTimePipe,
    protected paymentFacadeService: PaymentFacadeService,
    protected canvasServices: CanvasServicesService,
    protected dialog: MatDialog,
    protected snackBar: MatSnackBar,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected bottomSheet: MatBottomSheet,
    public canvasService: CanvasServicesService
  ) {
    if (generalConfigurations.enabledTools.management === false) {
      this.pagesFacade.showNotEnabledToolDialog();
      this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
    }
    if (this.moreInfoEnabled === true) {
      this.displayedColumns.push('moreInfo');
    }
    this.quickSearchForm = new FormGroup({
      search: new FormControl(''),
    });
    this.metadataForm = new FormGroup({
      creation: new FormControl({ disabled: true, value: '' }),
      registration: new FormControl({ disabled: true, value: '' }),
      expiration: new FormControl({ disabled: true, value: '' }),
    });
  }

  ngOnInit(): void {
    this.paymentStateSubscription = this.paymentFacadeService.paymentState$
      .pipe(
        map((s) => {
          this.paymentState = s;
        })
      )
      .subscribe();
    this.userStateSubscription = this.userFacade.userState$
      .pipe(
        map((s) => {
          this.userState = s;
          if (this.userState.user.walletAddress === undefined) {
            this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
            return;
          }
          this.getUserDomains();
        })
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    if (this.managementDialogSubscription) {
      this.managementDialogSubscription.unsubscribe();
    }
    if (this.saveChangesSubscripton) {
      this.saveChangesSubscripton.unsubscribe();
    }
    if (this.paymentStateSubscription) {
      this.paymentStateSubscription.unsubscribe();
    }
    if (this.userStateSubscription) {
      this.userStateSubscription.unsubscribe();
    }
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
  }

  getUserDomains() {
    let retries = 0;
    const userWalletAddres = this.userState.user.walletAddress;
    this.hasDomainsListLoaded = false;
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
    this.getUserDomainsSubscripton = this.userService
      .getUserDomains((userWalletAddres as string).toLowerCase())
      .pipe(
        map((r) => {
          const domains = (r as any).registrations
            .filter((d) => {
              return (
                this.domainsTransferred.includes(d.domain.labelName) ===
                  false && d.domain.labelName !== null
              );
            })
            .map((d) => {
              const gPeriod = this.ensService.calculateGracePeriodPercentage(
                parseInt(d.expiryDate, 10)
              );
              const fData = {
                id: d.domain.id.toLowerCase(),
                labelName: d.domain.labelName.toLowerCase(),
                labelHash: d.domain.labelhash.toLowerCase(),
                isNotAvailable: false,
                expiry: (parseInt(d.expiryDate) * 1000).toString(),
                gracePeriodPercent:
                  gPeriod < -100 ? undefined : 100 - Math.abs(gPeriod),
                registrationDate: (
                  parseInt(d.registrationDate) * 1000
                ).toString(),
                createdAt: (parseInt(d.domain.createdAt) * 1000).toString(),
                renew: false,
                transfer: false,
                detailExpanded: false,
              } as DomainMetadataModel;
              return fData;
            })
            .sort((a, b) => a.expiry - b.expiry);
          this.hasDomainsListLoaded = true;
          this.userDomains = domains;
          this.selectDomain(this.userDomains[0], false);
          this.dataSource = new MatTableDataSource<DomainMetadataModel>(
            this.filterSearchDomains()
          );
          this.dataSource.paginator = this.paginator;
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxRPCCallRetries),
            delayWhen((e) => {
              this.pageReset();
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                this.pagesFacade.setPageCriticalError(true);
              }
              retries++;
              return timer(generalConfigurations.timeToUpdateCheckoutPipe);
            })
          )
        )
      )
      .subscribe();
  }

  selectDomain(domain: DomainMetadataModel, detailExpand = true) {
    if (detailExpand === false) {
      this.collapseAllItems = true;
    } else {
      this.collapseAllItems = false;
    }
    this.selectedDomain = domain;
    this.metadataForm.controls.creation.setValue(
      this.formatTimeService.transform(
        parseInt(this.selectedDomain.createdAt).toString()
      )
    );
    this.metadataForm.controls.registration.setValue(
      this.formatTimeService.transform(
        parseInt(this.selectedDomain.registrationDate).toString()
      )
    );
    this.metadataForm.controls.expiration.setValue(
      this.timeAgoService.transform(
        parseInt(this.selectedDomain.expiry).toString()
      )
    );
  }

  selectAllToTransfer(domains: DomainMetadataModel[], toTransfer = false) {
    this.managementOperation = ManagementOperationEnum.TRANSFER;
    this.renewAllCheckbox.checked = false;
    if (toTransfer === false) {
      this.managementOperation = undefined;
    }
    const domainsToRenew = domains.map((d) => d.labelName);
    if (toTransfer === false) {
      this.userDomains = this.userDomains.map((d) => {
        return { ...d, transfer: false };
      });
      this.dataSource = new MatTableDataSource<DomainMetadataModel>(
        this.filterSearchDomains()
      );
      this.dataSource.paginator = this.paginator;
      return;
    }
    this.userDomains = this.userDomains.map((d) => {
      if (domainsToRenew.includes(d.labelName) && d.gracePeriodPercent <= 0) {
        return { ...d, transfer: true, renew: false };
      }
      return d;
    });
    this.dataSource = new MatTableDataSource<DomainMetadataModel>(
      this.filterSearchDomains()
    );
    this.dataSource.paginator = this.paginator;
  }

  selectAllToRenew(domains: DomainMetadataModel[], toRenew = false) {
    this.managementOperation = ManagementOperationEnum.RENEW;
    this.transferAllCheckbox.checked = false;
    if (toRenew === false) {
      this.managementOperation = undefined;
    }
    const domainsToRenew = domains.map((d) => d.labelName);
    if (toRenew === false) {
      this.userDomains = this.userDomains.map((d) => {
        return { ...d, renew: false };
      });
      this.dataSource = new MatTableDataSource<DomainMetadataModel>(
        this.filterSearchDomains()
      );
      this.dataSource.paginator = this.paginator;
      return;
    }
    this.userDomains = this.userDomains.map((d) => {
      if (domainsToRenew.includes(d.labelName)) {
        return { ...d, renew: true, transfer: false };
      }
      return d;
    });
    this.dataSource = new MatTableDataSource<DomainMetadataModel>(
      this.filterSearchDomains()
    );
    this.dataSource.paginator = this.paginator;
  }

  saveChanges() {
    const provider = globalAny.canvasProvider;
    const qualifiedTokenId = this.userDomains.filter((d) => {
      return d.gracePeriodPercent <= 100;
    })[0];
    const tokenId = BigNumber.from(qualifiedTokenId.labelHash).toString();
    if (this.saveChangesSubscripton) {
      this.saveChangesSubscripton.unsubscribe();
    }
    this.savingChangesInitiated = true;
    const domainsToTransfer = this.getDomainsToTransfer();
    if (
      domainsToTransfer.length <= 0 &&
      this.managementOperation === ManagementOperationEnum.TRANSFER
    ) {
      this.snackBar.open('Select a domain to transfer or renew.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      });
      this.savingChangesInitiated = false;
      return;
    }
    this.saveChangesSubscripton = this.ensMarketplaceService
      .checkApproval(tokenId, provider)
      .pipe(
        map((r) => {
          this.savingChangesInitiated = false;
          this.openOnboardingDialog(r);
        })
      )
      .subscribe();
  }

  openOnboardingDialog(approvalStatus: boolean) {
    if (this.managementDialogSubscription) {
      this.managementDialogSubscription.unsubscribe();
    }
    if (this.managementOperation === ManagementOperationEnum.RENEW) {
      const domainsToRenew = this.getDomainsToRenew();
      const dialogRef = this.dialog.open(RenewManagementComponent, {
        panelClass: 'cos-settings-dialog',
      });
      dialogRef.componentInstance.domainsToRenew = domainsToRenew;
      this.managementDialogSubscription = dialogRef
        .beforeClosed()
        .subscribe((r) => {
          this.managementOperation = undefined;
          this.renewAllCheckbox.checked = false;
          this.dataSource = new MatTableDataSource<DomainMetadataModel>(
            EMPTY_DATA
          );
          this.hasDomainsListLoaded = false;
          setTimeout(() => {
            this.getUserDomains();
          }, 2000);
        });
    } else if (this.managementOperation === ManagementOperationEnum.TRANSFER) {
      const domainsToTransfer = this.getDomainsToTransfer();
      const dialogRef = this.dialog.open(OnboardManagementComponent, {
        panelClass: 'cos-settings-dialog',
      });
      dialogRef.componentInstance.setStep(approvalStatus === true ? 2 : 0);
      dialogRef.componentInstance.domainsSelectedTransfer = domainsToTransfer;
      this.managementDialogSubscription = dialogRef
        .beforeClosed()
        .subscribe((r) => {
          this.managementOperation = undefined;
          if (dialogRef.componentInstance.transferComplete === true) {
            this.domainsTransferred = this.domainsTransferred.concat(
              domainsToTransfer.map((d) => d.labelName)
            );
          }
          this.transferAllCheckbox.checked = false;
          this.dataSource = new MatTableDataSource<DomainMetadataModel>(
            EMPTY_DATA
          );
          this.hasDomainsListLoaded = false;
          setTimeout(() => {
            this.getUserDomains();
          }, 2000);
        });
    }
  }

  filterSearchDomains() {
    const value = this.quickSearchForm.controls.search.value
      .replaceAll(' ', '')
      .replaceAll('.eth', '');
    try {
      if (value === undefined || value === '' || value === null) {
        return this.userDomains;
      }
      const filterValue = (value as any).toLowerCase();
      const domainsToSearch = this.userDomains.filter((d) => {
        if (d.labelName.indexOf(filterValue) > -1) {
          return true;
        }
        return false;
      });
      return domainsToSearch;
    } catch (e) {
      return this.userDomains;
    }
  }

  performFilter() {
    this.selectAllToRenew(this.userDomains, false);
    this.selectAllToTransfer(this.userDomains, false);
    this.renewAllCheckbox.checked = false;
    this.transferAllCheckbox.checked = false;
    const domainSearched = this.filterSearchDomains();
    this.dataSource = new MatTableDataSource<DomainMetadataModel>(
      domainSearched
    );
    this.dataSource.paginator = this.paginator;
  }

  selectDomainForTransfer(toTransfer) {
    this.managementOperation = ManagementOperationEnum.TRANSFER;
    const domainsSelectedForTransfer = this.getDomainsOnList();
    if (
      toTransfer === false &&
      domainsSelectedForTransfer.filter((d) => d.transfer === true).length <= 0
    ) {
      this.managementOperation = undefined;
    }
  }

  selectDomainForRenewal(toRenew) {
    this.managementOperation = ManagementOperationEnum.RENEW;
    const domainsSelectedForRenewal = this.getDomainsOnList();
    if (
      toRenew === false &&
      domainsSelectedForRenewal.filter((d) => d.renew === true).length <= 0
    ) {
      this.managementOperation = undefined;
    }
  }

  getDomainsOnList() {
    const skip =
      this.dataSource.paginator.pageSize * this.dataSource.paginator.pageIndex;
    const domainsToTransfer = this.dataSource.data
      .filter((u, i) => i >= skip)
      .filter(
        (u: DomainMetadataModel, i: number) =>
          i < this.dataSource.paginator.pageSize
      );
    return domainsToTransfer;
  }

  getDomainsToTransfer() {
    const skip =
      this.dataSource.paginator.pageSize * this.dataSource.paginator.pageIndex;
    const domainsToTransfer = this.dataSource.data
      .filter((u, i) => i >= skip)
      .filter(
        (u: DomainMetadataModel, i: number) =>
          i < this.dataSource.paginator.pageSize
      )
      .filter((d) => d.transfer === true);
    return domainsToTransfer;
  }

  getDomainsToRenew() {
    const skip =
      this.dataSource.paginator.pageSize * this.dataSource.paginator.pageIndex;
    const domainsToTransfer = this.dataSource.data
      .filter((u, i) => i >= skip)
      .filter(
        (u: DomainMetadataModel, i: number) =>
          i < this.dataSource.paginator.pageSize
      )
      .filter((d) => d.renew === true);
    return domainsToTransfer;
  }

  pretty(name: string) {
    try {
      const prettified = this.ensService.prettify(name);
      return prettified;
    } catch (e) {
      return name;
    }
  }

  selectRenewalDuration(duration: RenewalDurationsEnum) {
    this.renewalDuration = duration;
  }

  hashToBigIntString(hash: string) {
    return ethers.BigNumber.from(hash).toString();
  }

  pageReset() {
    this.hasDomainsListLoaded = false;
    this.userDomains = undefined;
  }

  goToHome() {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  goToPendingTx() {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + '/tx/' + this.pendingTx,
      '_blank'
    );
  }

  nextPage() {
    this.paginator.nextPage();
  }

  previousPage() {
    this.paginator.previousPage();
  }

  get pendingPayments() {
    return this.paymentFacadeService.paymentState$.pipe(
      switchMap((state) => {
        const payments = Object.keys(state.entities).filter(
          (p) =>
            (state.entities[p].paymentType === PaymentTypesEnum.TX_APPROVAL ||
              state.entities[p].paymentType === PaymentTypesEnum.TX_TRANSFER ||
              state.entities[p].paymentType === PaymentTypesEnum.TX_RENEW) &&
            state.entities[p].paymentStatus === false &&
            ('archived' in state.entities[p] === false ||
              ('archived' in state.entities[p] === true &&
                state.entities[p].archived === false))
        );
        if (payments.length > 0) {
          this.pendingTx =
            state.entities[payments[payments.length - 1]].paymentHash;
          this.hasPendingPayments = true;
          return of(true);
        }
        this.hasPendingPayments = false;
        return of(false);
      })
    );
  }

  get currentPage() {
    if (this.paginator === undefined) {
      return '';
    }
    return this.paginator.pageIndex * this.paginator.pageSize;
  }

  get currentPageList() {
    if (this.paginator === undefined) {
      return '';
    }
    return (
      this.paginator.pageIndex * this.paginator.pageSize +
      this.paginator.pageSize
    );
  }

  get entirePageSize() {
    if (this.paginator === undefined) {
      return '';
    }
    return this.paginator.length;
  }
}
