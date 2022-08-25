import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ethers } from 'ethers';
import { timer } from 'rxjs';
import { delayWhen, map, retryWhen, take } from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { PaymentStateModel } from 'src/app/models/states/payment-interfaces';
import { UserStateModel } from 'src/app/models/states/user-interfaces';
import { FormatTimePipe, TimeAgoPipe } from 'src/app/modules/pipes';
import { UserService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import {
  PagesFacadeService,
  PaymentFacadeService,
  UserFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';

const EMPTY_DATA: ENSDomainMetadataModel[] = [
  {
    id: null,
  },
];

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss'],
})
export class ManageComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  starCount = new Array(3).fill(0);
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  displayedColumns: string[] = ['labelName', 'expiry', 'action', 'moreInfo'];
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  dataSource = new MatTableDataSource<ENSDomainMetadataModel>(EMPTY_DATA);
  hasDomainsListLoaded = false;
  selectedDomain: ENSDomainMetadataModel;
  metadataForm: FormGroup;
  paymentState: PaymentStateModel;
  userState: UserStateModel;
  userDomains: ENSDomainMetadataModel[];
  paymentStateSubscription;
  userStateSubscription;
  getUserDomainsSubscripton;

  constructor(
    protected pagesFacade: PagesFacadeService,
    protected userFacade: UserFacadeService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected timeAgoService: TimeAgoPipe,
    protected formatTimeService: FormatTimePipe,
    protected paymentFacadeService: PaymentFacadeService,
    public canvasService: CanvasServicesService
  ) {
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

  getUserDomains() {
    let retries = 0;
    const userWalletAddres = this.userState.user.walletAddress;
    this.userService
      .getUserDomains((userWalletAddres as string).toLowerCase())
      .pipe(
        map((r) => {
          const domains = (r as any).registrations
            .map((d) => {
              const gPeriod = this.ensService.calculateGracePeriodPercentage(
                parseInt(d.expiryDate, 10)
              );
              const fData = {
                id: d.domain.id.toLowerCase(),
                labelName: d.domain.labelName.toLowerCase(),
                labelHash: d.domain.labelhash.toLowerCase(),
                isAvailable: false,
                expiry: (parseInt(d.expiryDate) * 1000).toString(),
                gracePeriodPercent:
                  gPeriod < -100 ? undefined : 100 - Math.abs(gPeriod),
                registrationDate: (
                  parseInt(d.registrationDate) * 1000
                ).toString(),
                createdAt: (parseInt(d.domain.createdAt) * 1000).toString(),
              } as ENSDomainMetadataModel;
              return fData;
            })
            .sort((a, b) => b.registrationDate - a.registrationDate);
          this.hasDomainsListLoaded = true;
          this.dataSource = new MatTableDataSource<ENSDomainMetadataModel>(
            domains
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

  selectDomain(domain: ENSDomainMetadataModel) {
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

  selectAllToRenew() {}

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
}
