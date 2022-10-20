import { of, Subject, timer } from 'rxjs';
import { ethers } from 'ethers';
import * as d3 from 'd3';
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
import { DomainMetadataModel } from 'src/app/models/domains';
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
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
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
  @ViewChild('creationPicker') creationPicker: any;
  placeholders = new Array(this.suitableItemPageWidthForWindow * 4).fill(0);
  pageCategory = this.category + '.' + generalConfigurations.categoriesDomain;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
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
  };

  chartData: ChartDataModel[];
  domainsListPerPage = this.suitableItemPageWidthForWindow * 4;
  domainsListPage = 0;
  domainsListResolving = false;

  salesList: SaleDiscoveredModel[];
  salesListPerPage = 28;
  salesListPage = 0;
  salesListResolving = false;

  showSalesActivity = false;
  bookmarks: DomainMetadataModel[];
  rootCategoryData: CategoriesRootModel;
  categoryNormalisedMetadata: CategoryMetaStatsModel;
  categoryIpfsData: CategoryModel;
  categoryApiData: CategoryModel;
  profileTexts: any;
  filterForm: FormGroup;
  categoryDomains;
  ethNameData;
  profileTextSubscription;
  activatedRouteSubscription;
  getCategoriesSubscription;
  domainListResolutionSubscription;
  salesListResolutionSubscription;
  userStateSubscription;
  bookmarkStateSubscription;

  constructor(
    public bookmarkService: BookmarksServiceService,
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
          this.getChartData(this.categoryNormalisedMetadata.sales);
          this.getProfileTexts();
          return this.getCategoryDomains(this.domainsInPage);
        }),
        switchMap((r) => {
          this.chart.initChart();
          this.categoryDomains = r;
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

  pageReset() {
    this.chartData = undefined;
    this.hasDomainsListLoaded = false;
    this.categoryDomains = undefined;
    this.salesList = undefined;
    this.ethNameData = undefined;
  }

  getCategoryDomains(domains: string[]) {
    let retries = 0;
    return this.ensService
      .findDomains(domains.map((r) => r.toLowerCase()))
      .pipe(
        switchMap((r) => {
          const domainsResolved = (r as any).registrations
            .filter((d) => {
              return d.domain.labelName !== null;
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
              } as DomainMetadataModel;
              this.hasDomainsListLoaded = true;
              return fData;
            })
            .sort((a, b) => b.registrationDate - a.registrationDate);
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
                this.domainsListResolving = false;
                this.pagesFacade.setPageCriticalError(true);
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

  filterSearchDomains(value: any = '') {
    if (value === undefined || value === '' || value === null) {
      return this.categoryDomains.filter((d) => {
        return this.extraFilters(d);
      });
    }
    const filterValue = (value as any).toLowerCase();
    return this.categoryDomains.filter((d) => {
      if (
        d.labelName.indexOf(filterValue) > -1 &&
        this.extraFilters(d) === true
      ) {
        return true;
      }
      return false;
    });
  }

  extraFilters(d: DomainMetadataModel) {
    const minL = this.filterForm.controls.minLength.value;
    const maxL = this.filterForm.controls.maxLength.value;
    const minD = this.getDateToStamp(this.filterForm.controls.creation.value);
    const regD = this.getDateToStamp(
      this.filterForm.controls.registration.value
    );
    const maxD = this.getDateToStamp(this.filterForm.controls.expiration.value);
    const containEmoji = this.typesFilter.emoji;
    const containAlphabet = this.typesFilter.alphabet;
    const containNumber = this.typesFilter.numbers;
    let satisfied;
    if (minD > 0 && minD !== null && parseInt(d.createdAt, 10) < minD) {
      return false;
    }
    if (regD > 0 && regD !== null && parseInt(d.registrationDate, 10) < regD) {
      return false;
    }
    if (maxD > 0 && maxD !== null && parseInt(d.expiry, 10) > maxD) {
      return false;
    }
    if ((d.labelName.length >= minL && d.labelName.length <= maxL) === false) {
      return false;
    }
    if (containEmoji === true) {
      if (this.isEmojiInLabel(d.labelName) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (containAlphabet === false && containNumber === false) {
      satisfied = true;
    } else if (containAlphabet === true && containNumber === false) {
      if (this.isAlphabetInLabel(d.labelName) === true) {
        satisfied = true;
      } else {
        return false;
      }
    } else if (containNumber === true && containAlphabet === true) {
      if (this.isAlphaNumericLabel(d.labelName) === true) {
        satisfied = true;
      } else {
        return false;
      }
    } else if (containNumber === true) {
      if (this.isNumberInLabel(d.labelName) === true) {
        satisfied = true;
      } else {
        return false;
      }
    }
    if (satisfied === undefined) {
      return true;
    }
    return satisfied;
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
      this.bookmarkService.isDomainBookmarked(
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

  openCreationPicker() {
    this.creationPicker.open();
  }

  countBookmarks() {
    return this.bookmarkService.countBookmarks();
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

  get actualValidNames() {
    if (
      this.categoryIpfsData.patterned === false &&
      this.categoryIpfsData.emojis === true
    ) {
      return Object.keys(this.categoryIpfsData.valid_names);
    }
    return this.categoryIpfsData.valid_names;
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
    return toFeedLazyLoad;
  }

  get dailyVolumeTrend() {
    if (
      this.categoryNormalisedMetadata === undefined ||
      this.categoryNormalisedMetadata.dailyVolume === 0
    ) {
      return 0;
    }
    if (this.categoryNormalisedMetadata.previousDailyVolume === 0) {
      return 0;
    }
    const previousVolumeDivisible =
      this.categoryNormalisedMetadata.previousDailyVolume / 100;
    const difference =
      this.categoryNormalisedMetadata.previousDailyVolume -
      this.categoryNormalisedMetadata.dailyVolume;
    const dailyVolumePercentage =
      this.categoryNormalisedMetadata.dailyVolume / previousVolumeDivisible;
    if (difference > 0) {
      return (0 - (100 - dailyVolumePercentage)).toFixed(2);
    }
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
      if (s.timestamp > startOfDay.getTime()) {
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
          s.timestamp > startOfDay.getTime() - 86400000 &&
          s.timestamp < startOfDay.getTime()
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
    let toDeduct = 350;
    return window.innerWidth - toDeduct - 110;
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
    console.log(windowW);
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
      return windowW / 2 - 5;
    }
    if (windowW > 600 && windowW <= 1200) {
      return windowW / 4 - 8;
    }
    if (windowW > 1200 && windowW <= 1999) {
      return windowW / 5 - 8;
    }
    return (windowW / 100) * 12.5 - 9;
  }
}
