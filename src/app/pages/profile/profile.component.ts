import { of, timer } from 'rxjs';
import { BigNumber, ethers } from 'ethers';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  delay,
  delayWhen,
  map,
  retryWhen,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';
import {
  DomainMetadataModel,
  DomainTypeEnum,
  FeaturedDomainsModel,
} from 'src/app/models/domains';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import {
  PageModesEnum,
  PagesEnum,
} from 'src/app/models/states/pages-interfaces';
import { MiscUtilsService, UserService } from 'src/app/services';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { EnsService } from 'src/app/services/ens';
import {
  RegistrationDataService,
  RegistrationServiceService,
} from 'src/app/services/registration';
import {
  CategoryFacadeService,
  ENSBookmarkFacadeService,
  PagesFacadeService,
  PaymentFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../../services/canvas-services/canvas-services.service';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DownloadService } from 'src/app/services/download/download.service';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { select, Store } from '@ngrx/store';
import { getENSBookmarks } from 'src/app/store/selectors';
import { CategoriesRootModel, CategoryModel } from 'src/app/models/category';
import { CategoriesDataService } from 'src/app/services/categories-data';
import { MatDialog } from '@angular/material/dialog';
import { SaleManagementComponent } from 'src/app/widgets/sale-management/sale-management.component';
import { EnsMarketplaceService } from 'src/app/services/ens-marketplace';
import { RenewManagementComponent } from 'src/app/widgets/renew-management';
import { OnboardManagementComponent } from 'src/app/widgets/onboard-management';
import { PaymentTypesEnum } from 'src/app/models/states/payment-interfaces';
import { MainHeaderComponent } from 'src/app/widgets/main-header';
import { FeaturedManagementComponent } from 'src/app/widgets/featured-management';
import { SetupManagementComponent } from 'src/app/widgets/setup-management';
import { GenericDialogComponent } from 'src/app/widgets/generic-dialog';

const globalAny: any = global;
const featureKey = 'predomain_featured';

export enum DisplayModes {
  CHUNK,
  AVATAR,
  LINEAR,
}

export enum ManageModes {
  DEFAULT,
  RENEW,
  TRANSFER,
}

export interface ProfileTexts {
  email?: string;
  description?: string;
  keywords?: string;
  discord?: string;
  twitter?: string;
  telegram?: string;
  url?: string;
  reddit?: string;
  predomainBanner?: string;
  predomainFeatured?: FeaturedDomainsModel;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('fadeTop') fadeTop: any;
  @ViewChild('scrollableContentContainer')
  scrollableContentContainer: ElementRef;
  @ViewChild('profileContentContainer')
  profileContentContainer: ElementRef;
  @ViewChild('expiredPicker') expiredPicker: any;
  @ViewChild('registrationPicker') registrationPicker: any;
  @ViewChild('creationPicker') creationPicker: any;
  @ViewChild('mainHeader') mainHeader: MainHeaderComponent;
  windowTopScroll = 0;
  placeholders = new Array(50).fill(0);
  manageMode: ManageModes = ManageModes.DEFAULT;
  domainsSelected: DomainMetadataModel[] = [];
  pageModes: typeof PageModesEnum = PageModesEnum;
  manageModes: typeof ManageModes = ManageModes;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  domainTypeSelected: DomainTypeEnum = DomainTypeEnum.ENS;
  pageMode: PageModesEnum = PageModesEnum.DEFAULT;
  hasDomainsListLoaded = false;
  avatarResolved = false;
  savingChangesInitiated = false;
  displayModes: typeof DisplayModes = DisplayModes;
  displayMode = DisplayModes.AVATAR;
  profileTexts: ProfileTexts = {};
  domainsOptimisedList = {};
  domainsFeatured: FeaturedDomainsModel = { order: [], featured: {} };
  domainsRecentlyTransferred: string[] = [];
  domainsListPerPage = this.suitableItemPageWidthForWindow * 10;
  domainsListPage = 0;
  domainsListResolving = false;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  typesFilter = {
    alphabet: false,
    numbers: false,
    emoji: false,
    palindrome: false,
    prepunk: false,
    repeating: false,
  };
  showEmojiPicker = false;
  hasPendingPayments = false;
  optimisedCategoryData: any = {};
  categoriesDataRaw: CategoryModel[] = [];
  filterForm: FormGroup;
  bookmarks: DomainMetadataModel[];
  categoriesData: CategoriesRootModel;
  pendingTx;

  lastDomainSearchResult;
  emojiPanel;
  userDomains;
  userDomainsList;
  userAddress;
  ethNameData;
  getUserDomainsSubscripton;
  getPageModeSubscription;
  profileTextSubscription;
  activatedRouteSubscription;
  managementDialogSubscription;
  bookmarkStateSubscription;
  categoriesDataSubscription;
  saveChangesSubscripton;
  domainListResolutionSubscription;
  errorDialogSubscription;

  constructor(
    public bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected pagesFacade: PagesFacadeService,
    protected ensMarketplaceService: EnsMarketplaceService,
    protected categoriesDataService: CategoriesDataService,
    protected categoriesFacade: CategoryFacadeService,
    protected registrationDataService: RegistrationDataService,
    protected paymentFacadeService: PaymentFacadeService,
    protected bookmarkFacadeService: ENSBookmarkFacadeService,
    protected bookmarkStore: Store<ENSBookmarkStateModel>,
    protected downloadService: DownloadService,
    protected activatedRoute: ActivatedRoute,
    protected miscUtils: MiscUtilsService,
    protected snackBar: MatSnackBar,
    protected router: Router,
    protected dialog: MatDialog,
    protected changeDetectorRef: ChangeDetectorRef,
    public canvasService: CanvasServicesService
  ) {
    if (generalConfigurations.enabledTools.profile === false) {
      this.pagesFacade.showNotEnabledToolDialog();
      this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
    }
    this.filterForm = new FormGroup({
      minLength: new FormControl(3),
      maxLength: new FormControl(20),
      contains: new FormControl(''),
      expiration: new FormControl(''),
      registration: new FormControl(''),
      creation: new FormControl(''),
      category: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.loadBookmarks();
    this.getCategoriesData();
    if (this.userName === false) {
      return;
    }
    this.getPageModeSubscription = this.pagesFacade.pageMode$
      .pipe(
        map((s) => {
          this.pageMode = s;
          this.domainsListPerPage = this.suitableItemPageWidthForWindow * 10;
        })
      )
      .subscribe();
    this.activatedRouteSubscription = this.activatedRoute.params
      .pipe(
        map((p) => {
          this.pageReset();
          this.getProfileTexts();
          this.getUserDomains();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.errorDialogSubscription) {
      this.errorDialogSubscription.unsubscribe();
    }
    if (this.getPageModeSubscription) {
      this.getPageModeSubscription.unsubscribe();
    }
    if (this.activatedRouteSubscription) {
      this.activatedRouteSubscription.unsubscribe();
    }
    if (this.profileTextSubscription) {
      this.profileTextSubscription.unsubscribe();
    }
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
    if (this.categoriesDataSubscription) {
      this.categoriesDataSubscription.unsubscribe();
    }
  }

  pageReset() {
    this.hasDomainsListLoaded = false;
    this.profileTexts = {};
    this.userDomainsList = undefined;
    this.userAddress = undefined;
    this.ethNameData = undefined;
  }

  getCategoriesData() {
    this.categoriesDataSubscription = this.categoriesFacade.getCategoryState$
      .pipe(
        switchMap((s) => {
          this.categoriesData = s.categoriesMetadata;
          return this.categoriesDataService.getCategoriesComperssedArchive(
            this.categoriesData.categories
          );
        }),
        map((s) => {
          for (const c of Object.keys(s)) {
            this.categoriesDataRaw.push(s[c]);
            const dataWithValues =
              Array.isArray(s[c].valid_names) === true
                ? s[c].valid_names
                : this.ensService.getDataOfObject(s[c].valid_names);
            this.optimisedCategoryData[c] =
              this.ensService.optimiseCategoryNamesList(dataWithValues);
          }
        })
      )
      .subscribe();
  }

  getUserDomains() {
    const isEthName = this.userName.indexOf('.') <= -1 ? false : true;
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
    if (
      isEthName === false &&
      this.miscUtils.checksumEtheruemAddress(this.userName) === false
    ) {
      this.pagesFacade.gotoPageRoute('notfound', PagesEnum.NOTFOUND);
      return;
    }
    let retries = 0;
    this.getUserDomainsSubscripton = (
      this.userName.indexOf('.')
        ? this.userService.getEthAddress(
            globalAny.canvasProvider,
            this.userName
          )
        : of(this.userDomains)
    )
      .pipe(
        switchMap((r) => {
          if (r === false || r === null) {
            throw false;
          }
          this.userAddress = r;
          let domains = [];
          let domainsPage = 0;
          let keepCollecting = true;
          return of(true).pipe(
            switchMap((i) =>
              this.userService.getUserDomains(
                (r as string).toLowerCase(),
                domainsPage
              )
            ),
            switchMap((d: any) => {
              if (d === false || d === null || d === undefined) {
                return of(false);
              }
              if (d.registrations.length <= 0) {
                return of([]);
              }
              domains = domains.concat(
                (d as any).registrations
                  .filter((n) => n.labelName !== null)
                  .map((n) => {
                    const name = this.ensService.qlResultToDomainModel(
                      n,
                      this.domainTypeSelected
                    );
                    if (
                      isEthName === true &&
                      n.domain.labelName.toLowerCase() ===
                        this.userName.replace('.eth', '').toLowerCase()
                    ) {
                      this.ethNameData = name;
                    }
                    return name;
                  })
              );
              if ((d as any).registrations.length >= 1000) {
                domainsPage++;
                throw false;
              }
              keepCollecting = false;
              return of(domains);
            }),
            retryWhen((error) =>
              error.pipe(
                delayWhen((e) => {
                  if (keepCollecting === false) {
                    return;
                  }
                  return timer(100);
                })
              )
            )
          );
        }),
        map((r) => {
          if (r === false) {
            throw false;
          }
          if ((r as any).length === 0) {
            this.hasDomainsListLoaded = true;
          }
          this.userDomains = r;
          this.domainsOptimisedList = this.ensService.optimiseCategoryNamesList(
            this.userDomains.map((r) => r.labelName)
          );
          if (
            this.profileTexts.predomainFeatured !== undefined &&
            Object.keys(this.profileTexts.predomainFeatured).length > 0
          ) {
            this.domainsFeatured = this.processFeatuerdNames(
              this.profileTexts.predomainFeatured
            );
          }
          this.loadMoreDomains();
          return;
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxRPCCallRetries),
            delayWhen((e) => {
              if (this.userDomains !== undefined) {
                return;
              }
              this.pageReset();
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                this.pagesFacade.setPageCriticalError(
                  true,
                  false,
                  this.pageMode === PageModesEnum.DEFAULT
                );
                return;
              }
              retries++;
              return timer(generalConfigurations.timeToUpdateCheckoutPipe);
            })
          )
        )
      )
      .subscribe();
  }

  getProfileTexts() {
    if (this.profileTextSubscription) {
      this.profileTextSubscription.unsubscribe();
    }
    if (this.userName === false) {
      return;
    }
    const ethName = this.userName;
    const provider = globalAny.canvasProvider;
    this.profileTextSubscription = this.userService
      .getUserText(provider, ethName, 'predomain_featured')
      .pipe(
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.predomainBanner = r as string;
          }
          return this.userService.getUserText(provider, ethName, featureKey);
        }),
        map((r) => {
          if (r !== null) {
            this.profileTexts.predomainFeatured = JSON.parse(r as string);
          }
        }),
        catchError((e) => {
          return of(false);
        })
      )
      .subscribe();
  }

  processFeatuerdNames(featuredData: FeaturedDomainsModel) {
    if (
      'items' in featuredData === false ||
      'tags' in featuredData === false ||
      'order' in featuredData === false ||
      featuredData === undefined ||
      featuredData === null
    ) {
      return {};
    }
    const tagged = {};
    featuredData.tags.reduce((c, p, i) => {
      const domainsInTag = Object.keys(featuredData.items).filter((dk) => {
        const dkItems = featuredData.items[dk].map(
          (dki) => dki.split(/_(.*)/s)[0]
        );
        return dkItems.includes(i.toString());
      });
      const domainsInTagPositions = Object.keys(featuredData.items)
        .map((dk) => {
          const dkItems = featuredData.items[dk].map(
            (dki) => dki.split(/_(.*)/s)[0]
          );
          const dkPos = featuredData.items[dk].map(
            (dki) => dki.split(/_(.*)/s)[1]
          );
          if (dkItems.includes(i.toString())) {
            return parseInt(dkPos[0]);
          } else {
            return undefined;
          }
        })
        .filter((dk) => dk !== undefined);
      const newArr = new Array(domainsInTag.length).fill('');
      let arPos = 0;
      domainsInTag.map((r) => {
        const pos = domainsInTagPositions[arPos];
        newArr[pos] = r;
        arPos++;
      });
      tagged[p] = newArr
        .map((d) => {
          return this.userDomains.filter((n) => n.labelName === d)[0];
        })
        .filter((r) => r !== undefined);
      return c;
    }, []);
    return {
      featured: tagged,
    } as FeaturedDomainsModel;
  }

  loadBookmarks() {
    this.bookmarkStateSubscription =
      this.bookmarkFacadeService.getENSBookmarkState$
        .pipe(
          withLatestFrom(this.bookmarkStore.pipe(select(getENSBookmarks))),
          map((state) => {
            const [bookmarkState, bookmarks] = state;
            this.bookmarks = bookmarks;
          })
        )
        .subscribe();
  }

  filterSearchDomains(value: any = '') {
    if (this.userDomainsList === undefined) {
      return [];
    }
    if (value === undefined || value === '' || value === null) {
      return this.userDomainsList.filter((d) => {
        return this.ensService.extraFilters(
          d,
          this.typesFilter,
          this.filterForm.controls
        );
      });
    }
    const filterValue = (value as any).toLowerCase();
    return this.userDomainsList.filter((d) => {
      if (
        d.labelName.indexOf(filterValue) > -1 &&
        this.ensService.extraFilters(
          d,
          this.typesFilter,
          this.filterForm.controls
        ) === true
      ) {
        return true;
      }
      return false;
    });
  }

  toggleBookmark(domain: DomainMetadataModel) {
    if (
      this.bookmarksService.isDomainBookmarked(
        this.bookmarks,
        domain.labelName
      ) === true
    ) {
      this.bookmarkFacadeService.removeBookmark(domain);
      return;
    }
    this.bookmarkFacadeService.upsertBookmark(domain);
  }

  hasViewBottomed(topHeight: number) {
    return (
      topHeight + document.body.clientHeight >
      this.scrollableContentContainer.nativeElement.scrollHeight - 5
    );
  }

  openExpiredPicker() {
    this.expiredPicker.open();
  }

  openRegistrationPicker() {
    this.registrationPicker.open();
  }

  openCreationPicker() {
    this.creationPicker.open();
  }

  countBookmarks() {
    return this.bookmarksService.countBookmarks();
  }

  countRegistrations() {
    return this.registrationService.countRegistrations();
  }

  goToHome() {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  goToDomain(domain: string) {
    this.pagesFacade.gotoPageRoute(
      (this.pageMode === PageModesEnum.PROFILE
        ? 'https://predomaine.eth.limo/#/'
        : '') +
        'domain/' +
        this.ensService.performNormalisation(domain).replace(/#⃣/g, '%23') +
        '.eth',
      PagesEnum.DOMAIN
    );
  }

  doUpdateInterface() {
    this.changeDetectorRef.markForCheck();
  }

  downloadDomainList() {
    const csv = this.ensService.downloadDomainsListCSV(this.userDomains);
    this.downloadService.download('text/csv;charset=utf-8', csv);
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  hideEmojiPickerOnBlur() {
    window.addEventListener('click', (e) => {
      if ((e as any).target) {
        this.showEmojiPicker = false;
      }
    });
  }

  addEmojiToFilter(e: any) {
    const currentKeyWordFilter = this.filterForm.controls.contains.value;
    this.filterForm.controls.contains.setValue(
      currentKeyWordFilter +
        this.ensService.performNormalisation(e.emoji.native)
    );
    this.resetLastDomainSearchResult();
  }

  openPurchasePanel(domain: DomainMetadataModel) {
    const dialogRef = this.dialog.open(SaleManagementComponent, {
      panelClass: 'cos-settings-dialog',
    });
    dialogRef.componentInstance.domain = domain;
  }

  copyShareLink() {
    const href = this.router.url;
    navigator.clipboard.writeText(environment.baseUrl + '/#' + href);
    this.snackBar.open('URL link copied.', 'close', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 5000,
    });
  }

  goToBlockscan() {
    window.open(
      generalConfigurations.blockscanLink + this.userAddress,
      '_blank'
    );
  }

  goToNftyChat() {
    window.open(
      generalConfigurations.nftyChatLink + this.userAddress,
      '_blank'
    );
  }

  goToStore() {
    window.open('https://' + this.userName + '.limo', '_blank');
  }

  goToEtherscan() {
    window.open(
      BlockExplorersEnum[environment.defaultChain] +
        '/address/' +
        this.userAddress,
      '_blank'
    );
  }

  setDisplayMode(mode: DisplayModes) {
    this.displayMode = mode;
  }

  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return value;
  }

  pretty(name: string) {
    try {
      const prettified = this.ensService.prettify(name);
      return prettified;
    } catch (e) {
      return name;
    }
  }

  domainValid(name: string) {
    return this.ensService.isDomainNameNotValid(name);
  }

  isEmojiInLabel(label: string) {
    return this.miscUtils.testEmoji().test(label);
  }

  isNumberInLabel(label: string) {
    return this.miscUtils.testIntNumeric().test(label);
  }

  isAlphabetInLabel(label: string) {
    return this.miscUtils.testAlpha().test(label);
  }

  isAlphaNumericLabel(label: string) {
    return this.miscUtils.testAlphaNumeric().test(label);
  }

  hashToBigIntString(hash: string) {
    return ethers.BigNumber.from(hash).toString();
  }

  getDomainLink(domain: string) {
    return environment.baseUrl + '/#/domain/' + domain.replace(/#⃣/g, '%23');
  }

  getDateToStamp(date: string) {
    if (date === '') {
      return null;
    }
    const d = new Date(date);
    return d.getTime();
  }

  backScrollContentToTop() {
    this.scrollableContentContainer.nativeElement.scrollTop = 0;
  }

  loadMoreDomains() {
    if (
      this.domainsListResolving === true ||
      this.domainListResolutionSubscription !== undefined ||
      this.domainsInPage.length <= 0
    ) {
      return;
    }
    this.domainsListResolving = true;
    if (this.domainListResolutionSubscription) {
      this.domainListResolutionSubscription.unsubscribe();
      this.domainListResolutionSubscription = undefined;
    }
    this.domainListResolutionSubscription = of(1)
      .pipe(
        delay(1000),
        map((r) => {
          this.hasDomainsListLoaded = true;
          if (this.domainListResolutionSubscription) {
            this.domainListResolutionSubscription.unsubscribe();
            this.domainListResolutionSubscription = undefined;
          }
          if (this.userDomainsList === undefined) {
            this.userDomainsList = this.domainsInPage;
            this.domainsListResolving = false;
            this.domainsListPage++;
            return;
          }
          this.userDomainsList = this.userDomainsList.concat(
            this.domainsInPage
          );
          this.domainsListResolving = false;
          this.domainsListPage++;
        })
      )
      .subscribe();
  }

  resetLastDomainSearchResult() {
    this.lastDomainSearchResult = undefined;
    this.userDomainsList = undefined;
    this.domainsListPage = 0;
    this.loadMoreDomains();
  }

  proceedManagement() {
    const provider = globalAny.canvasProvider;
    const qualifiedTokenId = this.userDomains.filter((d) => {
      return d.gracePeriodPercent <= 0;
    })[0];
    const tokenId = BigNumber.from(qualifiedTokenId.labelHash).toString();
    if (this.saveChangesSubscripton) {
      this.saveChangesSubscripton.unsubscribe();
    }
    this.savingChangesInitiated = true;
    const domainsToTransfer = this.domainsSelected;
    if (
      domainsToTransfer.length <= 0 &&
      this.manageMode === this.manageModes.TRANSFER
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
          this.openManagementDialog(r);
        })
      )
      .subscribe();
  }

  openFeaturedItemsManager() {
    const dialogRef = this.dialog.open(FeaturedManagementComponent, {
      panelClass: 'cos-settings-dialog',
    });
    dialogRef.componentInstance.userName = this.ethNameData;
    if (Object.keys(this.domainsFeatured).length <= 0) {
      dialogRef.componentInstance.features = { order: [], featured: {} };
    } else {
      dialogRef.componentInstance.features = {
        ...this.domainsFeatured,
        ...this.profileTexts.predomainFeatured,
      };
    }
    dialogRef.componentInstance.userDomains = this.userDomains;
    dialogRef.componentInstance.userNames = this.domainsOptimisedList;
  }

  openSetupStoreItemsManager() {
    const dialogRef = this.dialog.open(SetupManagementComponent, {
      panelClass: 'cos-settings-dialog',
    });
    dialogRef.componentInstance.userName = this.ethNameData;
    dialogRef.componentInstance.userNamesData = this.userDomains;
    dialogRef.componentInstance.userNames = this.domainsOptimisedList;
  }

  openManagementDialog(approvalStatus: boolean) {
    if (this.managementDialogSubscription) {
      this.managementDialogSubscription.unsubscribe();
    }
    if (
      this.domainsSelected === undefined ||
      this.domainsSelected.length <= 0
    ) {
      this.snackBar.open('Select a domain to transfer or renew.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      });
      return;
    }
    if (this.manageMode === ManageModes.RENEW) {
      const domainsToRenew = this.domainsSelected;
      const dialogRef = this.dialog.open(RenewManagementComponent, {
        panelClass: 'cos-settings-dialog',
      });
      dialogRef.componentInstance.domainsToRenew = domainsToRenew;
      this.managementDialogSubscription = dialogRef
        .beforeClosed()
        .subscribe((r) => {
          this.cancelManagement();
        });
    } else if (this.manageMode === ManageModes.TRANSFER) {
      const domainsToTransfer = this.domainsSelected;
      const dialogRef = this.dialog.open(OnboardManagementComponent, {
        panelClass: 'cos-settings-dialog',
      });
      dialogRef.componentInstance.setStep(approvalStatus === true ? 2 : 0);
      dialogRef.componentInstance.domainsSelectedTransfer = domainsToTransfer;
      this.managementDialogSubscription = dialogRef
        .beforeClosed()
        .subscribe((r) => {
          this.domainsRecentlyTransferred =
            this.domainsRecentlyTransferred.concat(
              domainsToTransfer.map((n) => n.labelHash)
            );
          this.cancelManagement();
        });
    }
  }

  getFeaturedDomainsByTag(tag: string) {
    if (Object.keys(this.domainsFeatured).length <= 0) {
      return [];
    }
    return this.domainsFeatured.featured[tag];
  }

  isDomainSelected(domain: DomainMetadataModel) {
    return (
      this.domainsSelected
        .map((d) => d.labelHash)
        .filter((d) => d === domain.labelHash).length > 0
    );
  }

  addOrRemoveDomainToSelectedList(domain: DomainMetadataModel) {
    if (this.isDomainSelected(domain) === true) {
      this.domainsSelected = this.domainsSelected.filter(
        (d) => d.labelHash !== domain.labelHash
      );
      return;
    }
    if (
      (this.manageMode === ManageModes.RENEW &&
        this.domainsSelected.length >=
          generalConfigurations.maxDomainsToRenew) ||
      (this.manageMode === ManageModes.TRANSFER &&
        this.domainsSelected.length >=
          generalConfigurations.maxDomainsToTransfer)
    ) {
      this.snackBar.open('Maximum limit reached.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      });
      return;
    }
    this.domainsSelected.push(domain);
  }

  goToPendingTx() {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + '/tx/' + this.pendingTx,
      '_blank'
    );
  }

  cancelManagement() {
    this.manageMode = this.manageModes.DEFAULT;
    this.domainsSelected = [];
  }

  displayDomain(domainHash: string) {
    if (this.domainsRecentlyTransferred.includes(domainHash) === true) {
      return false;
    }
    return true;
  }

  calculateProfileWidgetOpacity() {
    const yPos = this.windowTopScroll;
    return (1 / 1 - (300 - yPos) / 300).toString();
  }

  calculateProfileWidgetHeight() {
    const yPos = this.windowTopScroll;
    const c = 100 * (1 / 1 - (300 - yPos) / 300);
    if (c < 0) {
      return '0px';
    }
    if (c > 100) {
      return '100px';
    }
    return c + 'px';
  }

  get fadeTopExist() {
    return this.fadeTop !== undefined;
  }

  get isProfileOwnerByWallet() {
    if (
      this.userAddress === undefined ||
      this.mainHeader?.currentUserData?.walletAddress === undefined
    ) {
      return false;
    }
    return (
      this.userAddress.toLowerCase() ===
      this.mainHeader.currentUserData.walletAddress.toLowerCase()
    );
  }

  get featuredItemsExists() {
    const ds = this.domainsFeatured;
    if (ds === undefined || Object.keys(ds).length <= 0) {
      return false;
    }
    return (
      Object.keys(ds.featured).length > 0 &&
      Object.keys(ds.featured).reduce(
        (a, b, i) => a + ds.featured[b].length,
        0
      ) > 0
    );
  }

  get maxNumberOfSelectedDomainsDisplayed() {
    const w =
      document.getElementById('co-bottom-action-container').clientWidth -
      (this.isDeviceMobile === true ? 260 : 560);
    return parseInt((w / 60).toString());
  }

  get selectedDomainsToDisplay() {
    return this.domainsSelected.slice(
      0,
      this.maxNumberOfSelectedDomainsDisplayed
    );
  }

  get selectedDomainsCount() {
    return this.domainsSelected.length;
  }

  get featuredTags() {
    if (
      this.domainsFeatured === undefined ||
      Object.keys(this.domainsFeatured).length <= 0
    ) {
      return [];
    }
    return Object.keys(this.domainsFeatured.featured);
  }

  get actualValidNames() {
    if (this.userDomains === undefined) {
      return [];
    }
    let names = this.userDomains;
    return names.filter((n) => {
      const category = this.ensService.getNameCategory(
        n.labelName,
        n.labelHash.toString(),
        this.categoriesDataRaw,
        this.optimisedCategoryData
      );
      return (
        (this.filterForm.controls.category.value === '' ||
          (category !== undefined &&
            category === this.filterForm.controls.category.value)) &&
        this.ensService.extraFiltersPure(
          n.labelName,
          this.typesFilter,
          this.filterForm.controls,
          0,
          0
        ) &&
        this.ensService.extraFilters(
          n,
          this.typesFilter,
          this.filterForm.controls
        )
      );
    });
  }

  get domainsCount() {
    if (this.userDomains === undefined) {
      return undefined;
    }
    return this.userDomains.length;
  }
  get domainsInPage() {
    const toFeedLazyLoad = this.actualValidNames.slice(
      this.domainsListPage * this.domainsListPerPage,
      this.domainsListPage * this.domainsListPerPage + this.domainsListPerPage
    );
    return this.ensService.shuffleListOfNames(toFeedLazyLoad);
  }

  get searchKeyword() {
    return this.filterForm.controls.contains.value;
  }

  get linkUrl() {
    const href = this.router.url;
    return href;
  }

  get userName() {
    if ('user' in this.activatedRoute.snapshot.params === false) {
      return false;
    }
    const user = this.activatedRoute.snapshot.params.user;
    return user;
  }

  get isDeviceMobile() {
    return document.body.clientWidth <= 1000;
  }

  get suitableItemPageWidthForWindow() {
    const windowW = document.body.clientWidth;
    if (this.pageMode === PageModesEnum.PROFILE) {
      let t = 5;
      if (windowW <= 600) {
        t = 2;
      }
      if (windowW > 600 && windowW <= 1300) {
        t = 4;
      }
      return t;
    }
    let t = 8;
    if (windowW <= 600) {
      t = 2;
    }
    if (windowW > 600 && windowW <= 1300) {
      t = 4;
    }
    if (windowW > 1300 && windowW <= 1900) {
      t = 5;
    }
    return t;
  }

  get guideAvatarSize() {
    const windowW = document.body.clientWidth;
    if (this.pageMode === PageModesEnum.PROFILE) {
      if (windowW <= 600) {
        return (windowW - 60) / 2 - 10;
      }
      if (windowW > 600 && windowW <= 1300) {
        return (1300 - 60) / 4 - 16;
      }
      if (windowW > 1300 && windowW <= 1900) {
        return (1300 - 350) / 5 - 16;
      }
      return (1300 - 60) / 5 - 16;
    }
    if (windowW <= 600) {
      return (windowW - 60) / 2 - 10;
    }
    if (windowW > 600 && windowW <= 1300) {
      return (windowW - 60) / 4 - 16;
    }
    if (windowW > 1300 && windowW <= 1900) {
      return (windowW - 570) / 5 - 16;
    }
    return ((1900 - 380) / 100) * 12.5 - 18;
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
}
