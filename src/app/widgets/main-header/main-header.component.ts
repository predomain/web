import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import WalletConnect from '@walletconnect/client';
import { of, Subject, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { generalConfigurations, privatePages } from 'src/app/configurations';
import { HeaderControlModel } from 'src/app/models/states/header-interfaces';
import {
  PagesEnum,
  PagesStateModel,
} from 'src/app/models/states/pages-interfaces';
import { UserModel } from 'src/app/models/states/user-interfaces';
import { WalletTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { CanvasServicesService } from 'src/app/pages/canvas/canvas-services/canvas-services.service';
import { MiscUtilsService, UserService, WalletService } from 'src/app/services';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { RegistrationServiceService } from 'src/app/services/registration';
import {
  PagesFacadeService,
  PaymentFacadeService,
  UserFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { BulkSearchComponent } from '../bulk-search';
import { CustomAddressComponent } from '../custom-address';
import { GenericDialogComponent } from '../generic-dialog';
import { OnboardDialogComponent } from '../onboard-dialog';

const globalAny: any = global;

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss'],
})
export class MainHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('bulksearch') bulksearch: BulkSearchComponent;
  @Input() customUserName;
  @Input() cuatomUserNameAddress;
  @Input() show: HeaderControlModel;
  @Input() searchKeyword;
  @Output() openBookmark = new EventEmitter<boolean>();
  @Output() openRegistration = new EventEmitter<boolean>();
  connectTypes: typeof WalletTypesEnum = WalletTypesEnum;
  hasPendingRegistrations = false;
  goingHome = false;
  currentUserData: UserModel;
  quickSearchForm: FormGroup;
  pagesState: PagesStateModel;
  pagesStateSubscription: any;
  userServiceSubscription: any;
  customAddressDialogSubscription: any;
  customAddressDialogRef: MatDialogRef<CustomAddressComponent>;

  constructor(
    public userService: UserService,
    public userFacadeService: UserFacadeService,
    public pagesFacadeService: PagesFacadeService,
    public walletService: WalletService,
    public paymentFacadeService: PaymentFacadeService,
    public canvasServices: CanvasServicesService,
    public miscUtilsService: MiscUtilsService,
    protected bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialog: MatDialog
  ) {
    this.quickSearchForm = new FormGroup({
      search: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.pagesStateSubscription = this.pagesFacadeService.pagesState$
      .pipe(
        map((s) => {
          this.pagesState = s;
        })
      )
      .subscribe();
    this.checkEthName();
  }

  ngOnDestroy() {
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
      this.pagesStateSubscription = undefined;
    }
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
      this.userServiceSubscription = undefined;
    }
    if (this.customAddressDialogSubscription) {
      this.customAddressDialogSubscription.unsubscribe();
      this.customAddressDialogSubscription = undefined;
    }
  }

  checkEthName() {
    const takePageEntry = new Subject<boolean>();
    let nameIsResolving = false;
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
      this.pagesStateSubscription = undefined;
    }
    this.pagesStateSubscription = timer(0, 100)
      .pipe(
        filter((i) => {
          if (nameIsResolving === true) {
            return false;
          }
          nameIsResolving = true;
          return true;
        }),
        takeUntil(takePageEntry),
        switchMap((s) => {
          if (
            globalAny.canvasProvider === undefined ||
            this.currentUserData === undefined
          ) {
            return of(false);
          }
          return this.userService.getEthName(
            globalAny.canvasProvider,
            this.currentUserData.walletAddress
          );
        }),
        map((r) => {
          nameIsResolving = false;
          if (r === false) {
            if (
              this.currentUserData !== undefined &&
              this.currentUserData.walletAddress !== undefined
            )
              this.customUserName = this.currentUserData.walletAddress;
            return;
          }
          if (r === null) {
            this.customUserName = this.currentUserData.walletAddress;
            takePageEntry.next(false);
            return;
          }
          this.customUserName = r;
          takePageEntry.next(false);
        })
      )
      .subscribe();
  }

  getEthAddress(ethName: string) {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
      this.userServiceSubscription = undefined;
    }
    this.userServiceSubscription = this.userService
      .getEthAddress(globalAny.canvasProvider, ethName)
      .pipe(
        map((r) => {
          if (r === undefined || r === null || r === '') {
            return false;
          }
          this.userFacadeService.updateUser({
            walletAddress: r,
          } as UserModel);
        })
      )
      .subscribe();
  }

  setAddress(addr: string) {
    if (
      addr === '' ||
      (this.walletService.validateWalletAddress(addr) === false &&
        addr.indexOf('.eth') <= -1)
    ) {
      return false;
    }
    if (addr.substr(addr.length - 4) === '.eth') {
      this.getEthAddress(addr);
    } else {
      this.userFacadeService.updateUser({
        walletAddress: addr,
      } as UserModel);
    }
    return true;
  }

  openProfile() {
    if (this.customUserName !== undefined) {
      this.pagesFacadeService.gotoPageRoute(
        'profile/' + this.customUserName,
        PagesEnum.PROFILE
      );
      return;
    }
    this.pagesFacadeService.gotoPageRoute(
      'profile/' + this.currentUserData.walletAddress,
      PagesEnum.PROFILE
    );
  }

  openDocs() {
    window.open(generalConfigurations.docsLink, '_blank');
  }

  openConnect() {
    const dialogRef = this.dialog.open(OnboardDialogComponent, {
      data: 'ERRORS.UNKNOWN',
      panelClass: 'cos-onboard-dialog',
    });
  }

  goToCanvas() {
    this.pagesFacadeService.gotoPageRoute('canvas', PagesEnum.CANVAS);
  }

  goToCheckout() {
    this.pagesFacadeService.gotoPageRoute('checkout', PagesEnum.CHECKOUT);
  }

  countBookmarks() {
    return this.bookmarksService.countBookmarks();
  }

  countRegistrations() {
    return this.registrationService.countRegistrations();
  }

  disconnect() {
    if (this.currentUserData.connectType === WalletTypesEnum.WALLET_CONNECT) {
      const wc = globalAny.walletConnect as WalletConnect;
      wc.killSession();
    }
    this.userFacadeService.removeUser();
    this.changeDetectorRef.markForCheck();
    this.pagesFacadeService.gotoPageRoute('home', PagesEnum.HOME);
  }

  showRegistration() {
    this.bulksearch.registrationListOpen = true;
    this.bulksearch.bulkSearchBookmarksShow = false;
    const keywordsChunk = this.bulksearch.getBulkSearchEntriesFromForm(
      this.bulksearch.registrationDomains.map((d) => d.labelName).join(',')
    );
    this.bulksearch.performBulkSearch(false, keywordsChunk);
  }

  showBookmarks() {
    this.bulksearch.registrationListOpen = false;
    this.bulksearch.bulkSearchBookmarksShow = true;
    const keywordsChunk = this.bulksearch.getBulkSearchEntriesFromForm(
      this.bulksearch.bulkSearchBookmarks.map((d) => d.labelName).join(',')
    );
    this.bulksearch.performBulkSearch(false, keywordsChunk);
  }

  getChainName(chainCode: number) {
    if (
      chainCode === undefined ||
      chainCode in environment.validChainIds === false
    ) {
      return null;
    }
    return environment.validChainIds[chainCode.toString()];
  }

  getChainId(network: string) {
    return environment.networks[network].chainId;
  }

  setSearchKeywordOnInput(e: any) {
    this.searchKeyword = (e.target as HTMLInputElement).value;
  }

  goToProfile(profile: string) {
    this.pagesFacadeService.gotoPageRoute(
      'profile/' + profile,
      PagesEnum.PROFILE
    );
  }

  goToDomain(domain: string) {
    this.pagesFacadeService.gotoPageRoute('domain/' + domain, PagesEnum.DOMAIN);
  }

  get quickSearchKeysToChunk() {
    if (
      this.bulksearch === undefined ||
      this.searchKeyword === undefined ||
      this.searchKeyword === ''
    ) {
      return null;
    }
    let presult = this.bulksearch
      .getBulkSearchEntriesFromForm(this.searchKeyword)
      .map((d) => {
        return d + '.eth';
      });
    const possibleKeyChunk = this.searchKeyword
      .replaceAll(' ', '')
      .replaceAll('.eth', '')
      .split(',')
      .map((d) => d.toLowerCase());
    for (const pck of possibleKeyChunk) {
      if (this.miscUtilsService.checksumEtheruemAddress(pck) === true) {
        presult = this.miscUtilsService.prependToArray(pck, presult);
      }
    }
    return presult;
  }

  get searchKeysToChunk() {
    if (this.bulksearch === undefined) {
      return null;
    }
    return this.bulksearch.getBulkSearchEntriesFromForm(this.searchKeyword);
  }

  get registrationCount() {
    return this.countRegistrations();
  }

  get bookmarksCount() {
    return this.countBookmarks();
  }

  get currentNetworkId() {
    return globalAny.chainId;
  }

  get networks() {
    return environment.validChainIds;
  }

  get networkIds() {
    return Object.keys(environment.validChainIds);
  }

  get showDashboardIcon() {
    return this.pagesState.currentPageId !== PagesEnum.HOME;
  }

  get userData() {
    return this.userFacadeService.userState$.pipe(
      switchMap((s) => {
        if ('walletAddress' in s.user) {
          this.currentUserData = s.user;
          return of(s.user.walletAddress);
        }
        if (
          this.pagesState.currentPageId !== PagesEnum.HOME &&
          privatePages.indexOf(PagesEnum[this.pagesState.currentPageId]) > -1 &&
          this.goingHome === false
        ) {
          this.goingHome = true;
          this.pagesFacadeService.gotoPageRoute('home', PagesEnum.HOME);
        }
        return of(false);
      })
    );
  }

  get pendingRegistrations() {
    return this.paymentFacadeService.paymentState$.pipe(
      switchMap((state) => {
        if (
          Object.keys(state.entities).filter(
            (p) =>
              'archived' in state.entities[p] === false ||
              ('archived' in state.entities[p] === true &&
                state.entities[p].archived === false)
          ).length > 0
        ) {
          this.hasPendingRegistrations = true;
          return of(true);
        }
        this.hasPendingRegistrations = false;
        return of(false);
      })
    );
  }
}
