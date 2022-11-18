import { of, Subject, timer } from 'rxjs';
import { ethers } from 'ethers';
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
  delay,
  delayWhen,
  map,
  retryWhen,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import {
  DomainFiltersModel,
  DomainMetadataModel,
  DomainTypeEnum,
} from 'src/app/models/domains';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
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
  UserFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../../services/canvas-services/canvas-services.service';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DownloadService } from 'src/app/services/download/download.service';
import { HttpClient } from '@angular/common/http';
import {
  CategoriesRootModel,
  CategoryMetaStatsModel,
  CategoryModel,
  SaleDiscoveredModel,
} from 'src/app/models/category';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';
import { CategoriesDataService } from 'src/app/services/categories-data';
import { ResponseModel, ResponseTypesEnum } from 'src/app/models/http';
import { ChartDataModel } from 'src/app/models/charts';
import { DotComponent } from 'src/app/widgets/charts/dot/dot.component';
import { PoapService } from 'src/app/services/poap';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { select, Store } from '@ngrx/store';
import { getENSBookmarks } from 'src/app/store/selectors';
import { SaleManagementComponent } from 'src/app/widgets/sale-management/sale-management.component';
import { MatDialog } from '@angular/material/dialog';

const globalAny: any = global;

export enum DisplayModes {
  CHUNK,
  AVATAR,
  LINEAR,
}

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit, OnDestroy {
  @ViewChild('scrollableContentContainer')
  scrollableContentContainer: ElementRef;
  @ViewChild('chart') chart: DotComponent;
  @ViewChild('expiredPicker') expiredPicker: any;
  @ViewChild('registrationPicker') registrationPicker: any;
  placeholders = new Array(this.suitableItemPageWidthForWindow * 10).fill(0);
  pageCategory = this.category + '.' + generalConfigurations.categoriesDomain;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  domainTypeSelected: DomainTypeEnum = DomainTypeEnum.ENS;
  spinnerStatus = SpinnerModesEnum.LOADING;
  hasDomainsListLoaded = false;
  avatarResolved = false;
  displayModes: typeof DisplayModes = DisplayModes;
  displayMode = DisplayModes.AVATAR;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  typesFilter = {
    alphabet: false,
    numbers: false,
    emoji: false,
    palindrome: false,
    prepunk: false,
    repeating: false,
  } as DomainFiltersModel;

  subCategoryKeys: string[] = [];
  chartData: ChartDataModel[];
  domainsListPerPage = this.suitableItemPageWidthForWindow * 10;
  domainsListPage = 0;
  domainsListResolving = false;
  lastDomainSearchResult;

  salesList: SaleDiscoveredModel[];
  salesListPerPage = 28;
  salesListPage = 0;
  salesListResolving = false;

  showEmojiPicker = false;
  showSalesActivity = false;
  bookmarks: DomainMetadataModel[];
  rootCategoryData: CategoriesRootModel;
  categoryNormalisedMetadata: CategoryMetaStatsModel;
  categoryIpfsData: CategoryModel;
  categoryApiData: CategoryModel;

  profileTexts: any;
  filterForm: FormGroup;
  emojiPanel;
  categoryDomains;
  categorySearchedDomains;
  ethNameData;
  profileTextSubscription;
  activatedRouteSubscription;
  getCategoriesSubscription;
  domainListResolutionSubscription;
  salesListResolutionSubscription;
  userStateSubscription;
  bookmarkStateSubscription;

  constructor(
    public bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected pagesFacade: PagesFacadeService,
    protected registrationDataService: RegistrationDataService,
    protected downloadService: DownloadService,
    protected activatedRoute: ActivatedRoute,
    protected userFacade: UserFacadeService,
    protected bookmarkFacadeService: ENSBookmarkFacadeService,
    protected categoryFacade: CategoryFacadeService,
    protected categoriesDataService: CategoriesDataService,
    protected bookmarkStore: Store<ENSBookmarkStateModel>,
    protected poapService: PoapService,
    protected miscUtils: MiscUtilsService,
    protected snackBar: MatSnackBar,
    protected router: Router,
    protected httpClient: HttpClient,
    protected dialog: MatDialog,
    protected changeDetectorRef: ChangeDetectorRef,
    public canvasService: CanvasServicesService
  ) {
    if (generalConfigurations.enabledTools.category === false) {
      this.pagesFacade.showNotEnabledToolDialog();
      this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
    }
    this.userStateSubscription = this.userFacade.user$
      .pipe(
        map((s) => {
          if (
            generalConfigurations.enablePoapResolution === false ||
            s.poapsResolved === false ||
            s.poapsResolved === undefined
          ) {
            return;
          }
          const userPoaps = s.poaps;
          const poapRequirement =
            generalConfigurations.poapRequiredTools.category;
          const validPoap = poapRequirement.poapId;
          const userPoapTokens = this.poapService.getPoapTokensByPoapId(
            s.poapTokens,
            validPoap
          );
          if (
            (poapRequirement.required === true && userPoaps === undefined) ||
            s.walletAddress === undefined ||
            s.walletAddress === null ||
            userPoaps.includes(poapRequirement.poapId) === false ||
            (poapRequirement.allowedIds !== null &&
              poapRequirement.allowedIds.includes(userPoapTokens[0]) === false)
          ) {
            this.pagesFacade.showNotEnabledToolDialog();
            this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
          }
        })
      )
      .subscribe();
    this.filterForm = new FormGroup({
      subcategory: new FormControl(''),
      minLength: new FormControl(3),
      maxLength: new FormControl(20),
      contains: new FormControl(''),
      expiration: new FormControl(''),
      registration: new FormControl(''),
      creation: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.loadBookmarks();
    this.hideEmojiPickerOnBlur();
    this.activatedRouteSubscription = this.activatedRoute.params
      .pipe(
        map((p) => {
          this.pageReset();
          this.getCategory();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.activatedRouteSubscription) {
      this.activatedRouteSubscription.unsubscribe();
    }
    if (this.profileTextSubscription) {
      this.profileTextSubscription.unsubscribe();
    }
    if (this.userStateSubscription) {
      this.userStateSubscription.unsubscribe();
    }
  }

  getCategory() {
    if (this.getCategoriesSubscription) {
      this.getCategoriesSubscription.unsubscribe();
      this.getCategoriesSubscription = undefined;
    }
    const category = this.category;
    if (category === false) {
      this.pagesFacade.gotoPageRoute('not-found', PagesEnum.NOTFOUND);
    }
    let retries = 0;
    let retrieveDone = new Subject<boolean>();
    const provider = globalAny.canvasProvider;
    this.getCategoriesSubscription = this.categoryFacade.getCategoryState$
      .pipe(
        switchMap((r) => {
          if (r.categoriesMetadata === undefined) {
            throw false;
          }
          this.rootCategoryData = (r as CategoriesStateModel)
            .categoriesMetadata as CategoriesRootModel;
          if (generalConfigurations.categoriesUseFallback === true) {
            return of('fallback');
          }
          return this.ensService.getDomainContentHash(
            provider,
            category + '.' + generalConfigurations.categoriesDomain
          );
        }),
        switchMap((r) => {
          if (r === false || r === null) {
            throw false;
          }
          return this.categoriesDataService.getCategoriesIpfsMetadata(
            r as string,
            category
          );
        }),
        switchMap((r) => {
          if (r === false || r === null) {
            throw false;
          }
          this.categoryIpfsData = r as any;
          this.categoryIpfsData.valid_names = this.miscUtils.shuffleArray(
            this.categoryIpfsData.valid_names
          );
          return this.categoriesDataService
            .getCategoriesData(
              environment.development === true
                ? generalConfigurations.categoiesDataSourceFallback
                : this.rootCategoryData.activeProviders[0],
              category
            )
            .pipe(switchMap((r) => of(r)));
        }),
        switchMap((r) => {
          if (
            r === false ||
            ('statusCode' in (r as any) && (r as any)?.statusCode !== 200) ||
            r === null ||
            r === undefined
          ) {
            throw false;
          }
          const requestResult = r as ResponseModel;
          if (requestResult.type === ResponseTypesEnum.FAILURE) {
            throw false;
          }
          this.categoryApiData = (r as ResponseModel).result as CategoryModel;
          this.categoryNormalisedMetadata = {
            previousHourlySales:
              this.categoryApiData.volume.previous_hourly_sales,
            hourlySales: this.categoryApiData.volume.hourly_sales,
            previousDailyVolume:
              this.categoryApiData.volume.previous_daily_volume,
            dailyVolume: this.categoryApiData.volume.daily_volume,
            topSale:
              this.categoryApiData.volume.sales.length === 0
                ? 0.0
                : parseFloat(
                    this.categoryApiData.volume.sales.sort(
                      (a, b) => parseFloat(b.price) - parseFloat(a.price)
                    )[0].price
                  ),
            topBuyer:
              this.categoryApiData.volume.sales.length === 0
                ? 'N/A'
                : this.categoryApiData.volume.sales.sort(
                    (a, b) => parseFloat(b.price) - parseFloat(a.price)
                  )[0].buyer,
            domainsCount: this.actualValidNames.length,
            sales:
              this.categoryApiData.volume.sales === null
                ? []
                : this.categoryApiData.volume.sales.sort(
                    (a, b) => b.timestamp - a.timestamp
                  ),
          };
          this.loadMoreSales();
          this.getSubCategories();
          this.getChartData(this.categoryNormalisedMetadata.sales);
          this.getProfileTexts();
          return this.getCategoryDomains(this.domainsInPage);
        }),
        switchMap((r) => {
          this.chart.initChart();
          this.changeDetectorRef.markForCheck();
          return this.userService.getEthName(
            provider,
            this.categoryNormalisedMetadata.topBuyer
          );
        }),
        map((r) => {
          retrieveDone.next(false);
          if (r === false || r === null) {
            return;
          }
          this.categoryNormalisedMetadata.topBuyerEthName = r as string;
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxRPCCallRetries),
            takeUntil(retrieveDone),
            delayWhen((e) => {
              this.pageReset();
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                this.pagesFacade.setPageCriticalError(true);
                this.pagesFacade.gotoPageRoute('not-found', PagesEnum.NOTFOUND);
                return of(false);
              }
              retries++;
              return timer(generalConfigurations.timeToUpdateCheckoutPipe);
            })
          )
        )
      )
      .subscribe();
  }

  pageReset(chartReset = true) {
    if (chartReset === true) {
      this.chartData = undefined;
    }
    this.hasDomainsListLoaded = false;
    this.categoryDomains = undefined;
    this.salesList = undefined;
    this.domainsListPage = 0;
  }

  getCategoryDomains(domains: string[]) {
    let retries = 0;
    let regTime = new Date(
      this.filterForm.controls.registration.value as any
    )?.getTime();
    let expTime = new Date(
      this.filterForm.controls.expiration.value as any
    )?.getTime();
    const now = parseInt((new Date().getTime() / 1000).toString());
    return this.ensService
      .findDomains(
        domains.map((r) => r.toLowerCase()),
        this.typesFilter.prepunk === true,
        expTime !== NaN ? (expTime / 1000).toString() : expTime.toString(),
        regTime !== NaN ? (regTime / 1000).toString() : regTime.toString()
      )
      .pipe(
        switchMap((r) => {
          const domainsResolved = (r as any).registrations
            .filter((d) => {
              const isDomainPastGracePeriod =
                now > parseInt(d.expiryDate) + 7889400;
              return (
                isDomainPastGracePeriod === true || d.domain.labelName !== null
              );
            })
            .map((d) => {
              return this.ensService.qlResultToDomainModel(
                d,
                this.domainTypeSelected
              );
            })
            .sort((a, b) => b.registrationDate - a.registrationDate);
          this.hasDomainsListLoaded = true;
          this.lastDomainSearchResult = domainsResolved;
          if (this.domainListResolutionSubscription) {
            this.domainListResolutionSubscription.unsubscribe();
            this.domainListResolutionSubscription = undefined;
          }
          this.domainsListResolving = false;
          this.domainsListPage++;
          if (this.categoryDomains === undefined) {
            this.categoryDomains = domainsResolved;
            return of(this.categoryDomains);
          }
          this.categoryDomains = this.categoryDomains.concat(domainsResolved);
          return of(this.categoryDomains);
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxRPCCallRetries),
            delayWhen((e) => {
              this.pageReset();
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                if (this.domainListResolutionSubscription) {
                  this.domainListResolutionSubscription.unsubscribe();
                  this.domainListResolutionSubscription = undefined;
                }
                this.domainsListResolving = false;
                return of(false);
              }
              retries++;
              return timer(generalConfigurations.timeToUpdateCheckoutPipe);
            })
          )
        )
      );
  }

  getChartData(salesData: SaleDiscoveredModel[]) {
    let highesValue = 0.0;
    const timeRangeMs = generalConfigurations.categoryChartTimeRange;
    this.chartData = salesData
      .map((s) => {
        if (parseFloat(s.price) > highesValue) {
          highesValue = parseFloat(s.price);
        }
        return s;
      })
      .map((s) => {
        const radius = 10 + (5 - (5 / highesValue) * parseFloat(s.price));
        if (s)
          return {
            y: parseFloat(s.price),
            x: s.timestamp,
            radius: 15 - radius < 4 ? 4 : radius,
            domain: s.domain + '.eth',
            price: this.priceToFixedString(s.price),
          };
      })
      .filter((s) => {
        const timeRangeLimitInPast = new Date().getTime() - timeRangeMs;
        if (s.x < timeRangeLimitInPast) {
          return false;
        }
        return true;
      });
  }

  getSubCategories() {
    if ('filters' in this.categoryIpfsData === false) {
      return;
    }
    this.subCategoryKeys = Object.keys(this.categoryIpfsData.filters);
  }

  priceToFixedString(price: string, decimals: number = 3) {
    return parseFloat(price).toFixed(decimals);
  }

  priceToFixed(price: number, decimals: number = 3) {
    return price.toFixed(decimals);
  }

  getTimeFromDate(date: string) {
    return new Date(date).getTime().toString();
  }

  getProfileTexts() {
    if (
      'profileTexts' in this.categoryApiData &&
      this.categoryApiData.profileTexts !== undefined
    ) {
      this.profileTexts = this.categoryApiData.profileTexts;
      return;
    }
    this.profileTexts = {};
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmojiToFilter(e: any) {
    const currentKeyWordFilter = this.filterForm.controls.contains.value;
    this.filterForm.controls.contains.setValue(
      currentKeyWordFilter +
        this.ensService.performNormalisation(e.emoji.native)
    );
    this.resetLastDomainSearchResult();
  }

  hideEmojiPickerOnBlur() {
    window.addEventListener('click', (e) => {
      if ((e as any).target) {
        this.showEmojiPicker = false;
      }
    });
  }

  filterSearchDomains(value: any = '') {
    if (value === undefined || value === '' || value === null) {
      return this.categoryDomains.filter((d) => {
        return this.ensService.extraFilters(
          d,
          this.typesFilter,
          this.filterForm.controls
        );
      });
    }
    const filterValue = (value as any).toLowerCase();
    return this.categoryDomains.filter((d) => {
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
        switchMap((r) => this.getCategoryDomains(this.domainsInPage))
      )
      .subscribe();
  }

  loadMoreSales() {
    if (
      this.salesListResolving === true ||
      this.salesListResolutionSubscription !== undefined ||
      this.salesInPage.length <= 0
    ) {
      return;
    }
    this.salesListResolving = true;
    if (this.salesListResolutionSubscription) {
      this.salesListResolutionSubscription.unsubscribe();
      this.salesListResolutionSubscription = undefined;
    }
    this.salesListResolutionSubscription = of(1)
      .pipe(
        delay(1000),
        map((r) => {
          if (this.salesListResolutionSubscription) {
            this.salesListResolutionSubscription.unsubscribe();
            this.salesListResolutionSubscription = undefined;
          }
          if (this.salesList === undefined) {
            this.salesList = this.salesInPage;
            this.salesListResolving = false;
            this.salesListPage++;
            return;
          }
          this.salesList = this.salesList.concat(this.salesInPage);
          this.salesListResolving = false;
          this.salesListPage++;
        })
      )
      .subscribe();
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

  lazyLoad() {
    if (this.showSalesActivity === true) {
      this.loadMoreSales();
      return;
    }
    this.loadMoreDomains();
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

  openExpiredPicker() {
    this.expiredPicker.open();
  }

  openRegistrationPicker() {
    this.registrationPicker.open();
  }

  openPurchasePanel(domain: DomainMetadataModel) {
    const dialogRef = this.dialog.open(SaleManagementComponent, {
      panelClass: 'cos-settings-dialog',
    });
    dialogRef.componentInstance.domain = domain;
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
    const csv = this.ensService.downloadDomainsListCSV(this.categoryDomains);
    this.downloadService.download('text/csv;charset=utf-8', csv);
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

  goToEtherscanTx(txHash: string) {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + '/tx/' + txHash,
      '_blank'
    );
  }

  goToEtherscanAddress(address: string) {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + '/address/' + address,
      '_blank'
    );
  }

  doShowSalesActivity(show: boolean) {
    this.showSalesActivity = show;
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

  hashToBigIntString(hash: string) {
    return ethers.BigNumber.from(hash).toString();
  }

  getDomainLink(domain: string) {
    return environment.baseUrl + '/#/domain/' + domain.replace(/#⃣/g, '%23');
  }

  hasViewBottomed(topHeight: number) {
    return (
      topHeight + document.body.clientHeight >
      this.scrollableContentContainer.nativeElement.scrollHeight - 5
    );
  }

  backScrollContentToTop() {
    this.scrollableContentContainer.nativeElement.scrollTop = 0;
  }

  timeNumberToString(time: number) {
    return time.toString();
  }

  resetLastDomainSearchResult() {
    this.lastDomainSearchResult = undefined;
    this.pageReset(false);
    this.loadMoreDomains();
  }

  get actualValidNames() {
    if (this.categoryIpfsData === undefined) {
      return [];
    }
    let names = this.categoryIpfsData.valid_names;
    if (
      this.categoryIpfsData.patterned === false &&
      this.categoryIpfsData.emojis === true
    ) {
      names = Object.keys(names);
    }
    if (
      this.categoryIpfsData.patterned === false &&
      this.categoryIpfsData.emojis === true &&
      this.filterForm.controls.subcategory.value !== ''
    ) {
      names = Object.keys(
        this.categoryIpfsData.filters[
          this.filterForm.controls.subcategory.value
        ]
      );
    }
    return names.filter((n) =>
      this.ensService.extraFiltersPure(
        n,
        this.typesFilter,
        this.filterForm.controls,
        this.categoryIpfsData.prefix_offset,
        this.categoryIpfsData.suffix_offset
      )
    );
  }

  get containTextFilterIsOn() {
    return this.filterForm.controls.contains.value !== '';
  }

  get salesInPage() {
    const toFeedLazyLoad = this.categoryNormalisedMetadata.sales.slice(
      this.salesListPage * this.salesListPerPage,
      this.salesListPage * this.salesListPerPage + this.salesListPerPage
    );
    return toFeedLazyLoad;
  }

  get domainsInPage() {
    const toFeedLazyLoad = this.actualValidNames.slice(
      this.domainsListPage * this.domainsListPerPage,
      this.domainsListPage * this.domainsListPerPage + this.domainsListPerPage
    );
    return this.ensService.shuffleListOfNames(toFeedLazyLoad);
  }

  get dailySalesVolume() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0.0;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const sales = this.categoryNormalisedMetadata.sales.filter((s) => {
      if (
        s.timestamp >= startOfDay.getTime() - 43200000 &&
        s.timestamp < startOfDay.getTime() + 43200000
      ) {
        return true;
      }
      return false;
    });
    return sales.reduce((a, b) => {
      return a + parseFloat(b.price);
    }, 0);
  }

  get previousDailySalesVolume() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0.0;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const previousVolume = this.categoryNormalisedMetadata.sales
      .filter((s) => {
        if (
          s.timestamp > startOfDay.getTime() - 86400000 &&
          s.timestamp < startOfDay.getTime()
        ) {
          return true;
        }
        return false;
      })
      .reduce((a, b) => a + parseFloat(b.price), 0);
    return previousVolume;
  }

  get dailyVolumeTrend() {
    if (
      this.categoryNormalisedMetadata === undefined ||
      this.dailySalesVolume === 0
    ) {
      return 0;
    }
    if (this.previousDailySalesVolume === 0) {
      return 0;
    }
    const difference = this.dailySalesVolume - this.previousDailySalesVolume;
    if (difference > 0) {
      const volumeDivisible = this.dailySalesVolume / 100;
      const dailyVolumePercentage = difference / volumeDivisible;
      return dailyVolumePercentage.toFixed(2);
    }
    const previousVolumeDivisible = this.previousDailySalesVolume / 100;
    const dailyVolumePercentage =
      0 - Math.abs(difference) / previousVolumeDivisible;
    return dailyVolumePercentage.toFixed(2);
  }

  get salesCountThisMonth() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0;
    }
    const date = new Date();
    const startOfMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).getTime();
    return this.categoryNormalisedMetadata.sales.filter((s) => {
      if (s.timestamp > startOfMonth) {
        return true;
      }
      return false;
    }).length;
  }

  get monthlySaleTrend() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0;
    }
    const date = new Date();
    const previousMonth =
      new Date(date.getFullYear(), date.getMonth(), 1).getTime() -
      86400000 * 30;
    const startOfMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).getTime();
    const previousMonthSales = this.categoryNormalisedMetadata.sales.filter(
      (s) => {
        if (s.timestamp > previousMonth && s.timestamp < startOfMonth) {
          return true;
        }
        return false;
      }
    ).length;
    if (previousMonthSales === 0) {
      return this.salesCountThisMonth;
    }
    const difference = previousMonthSales - this.salesCountThisMonth;
    return difference;
  }

  get salesCountToday() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    return this.categoryNormalisedMetadata.sales.filter((s) => {
      if (s.timestamp > startOfDay.getTime() - 43200000) {
        return true;
      }
      return false;
    }).length;
  }

  get dailySaleTrend() {
    if (this.categoryNormalisedMetadata === undefined) {
      return 0;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const previousDaySales = this.categoryNormalisedMetadata.sales.filter(
      (s) => {
        if (
          s.timestamp > startOfDay.getTime() - 43200000 &&
          s.timestamp < startOfDay.getTime() + 43200000
        ) {
          return true;
        }
        return false;
      }
    ).length;
    if (previousDaySales === 0) {
      return this.salesCountToday;
    }
    const difference = previousDaySales - this.salesCountToday;
    return difference;
  }

  get chartWidth() {
    const windowW = document.body.clientWidth;
    if (windowW <= 600) {
      return (windowW - 60) / 2 - 5;
    }
    if (windowW > 600 && windowW <= 1200) {
      return (windowW - 60) / 4 - 8;
    }
    if (windowW > 1200 && windowW <= 1900) {
      return (windowW / 100) * 90 - 430;
    }
    return 1900 - 430;
  }

  get searchKeyword() {
    return this.filterForm.controls.contains.value;
  }

  get linkUrl() {
    const href = this.router.url;
    return href;
  }

  get category() {
    if ('category' in this.activatedRoute.snapshot.params === false) {
      return false;
    }
    const category = this.activatedRoute.snapshot.params.category.toLowerCase();
    return category;
  }

  get isDeviceMobile() {
    return document.body.clientWidth <= 600;
  }

  get suitableItemPageWidthForWindow() {
    const windowW = document.body.clientWidth;
    if (windowW <= 600) {
      return 2;
    }
    if (windowW > 600 && windowW <= 1200) {
      return 4;
    }
    if (windowW > 1200 && windowW <= 1999) {
      return 5;
    }
    return 8;
  }

  get guideAvatarSize() {
    const windowW = document.body.clientWidth;
    if (windowW <= 600) {
      return (windowW - 60) / 2 - 5;
    }
    if (windowW > 600 && windowW <= 1200) {
      return (windowW - 60) / 4 - 8;
    }
    if (windowW > 1200 && windowW <= 1900) {
      return (windowW - 570) / 5 - 8;
    }
    return ((1900 - 430) / 100) * 12.5 - 9;
  }
}
