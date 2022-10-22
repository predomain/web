import { of } from 'rxjs';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserModel } from 'src/app/models/states/user-interfaces';
import { EnsService } from 'src/app/services/ens';
import {
  CategoryFacadeService,
  PagesFacadeService,
  UserFacadeService,
} from 'src/app/store/facades';
import { MainHeaderComponent } from 'src/app/widgets/main-header';
import { MiscUtilsService } from 'src/app/services';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { generalConfigurations } from 'src/app/configurations';
import { DomainTypeEnum } from 'src/app/models/domains';
import { XMLParser } from 'fast-xml-parser';
import { CategoriesDataService } from 'src/app/services/categories-data';
import { CategoriesRootModel } from 'src/app/models/category';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { PoapService } from 'src/app/services/poap';

const globalAny: any = global;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy, OnInit {
  @ViewChild('mainHeader') mainHeader: MainHeaderComponent;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  placeholders = new Array(20).fill(0);
  placeholdersTopSection = new Array(5).fill(0);
  domainTypes: typeof DomainTypeEnum = DomainTypeEnum;
  categories: string[];
  categoriesRootVolume: { category: string; volume: number }[];
  metadata: CategoriesRootModel;
  userPoaps: string[];
  userTokenIds: string[];
  requiredPoapsForCategoryDisplay =
    generalConfigurations.poapRequiredTools.category.poapId;
  requiredPoapTOkensForCategoryDisplay =
    generalConfigurations.poapRequiredTools.category.allowedIds;
  topCategories: {
    category: string;
    volume: number;
  }[] = [];
  topSales: {
    domain: string;
    price: string;
    timestamp: number;
  }[] = [];
  recentSales: {
    domain: string;
    price: string;
    timestamp: number;
  }[] = [];
  blogs;
  currentUserData: UserModel;
  mainSearchForm: FormGroup;
  donationBoxOpen = true;
  getBlogsListSubscription;
  getRootVolumeSubscription;
  userStateSubscription;

  constructor(
    public ensService: EnsService,
    public miscUtilsService: MiscUtilsService,
    protected httpClient: HttpClient,
    protected userFacadeService: UserFacadeService,
    protected categoryFacade: CategoryFacadeService,
    protected categoriesDataService: CategoriesDataService,
    protected poapService: PoapService,
    protected pagesFacade: PagesFacadeService,
    protected detectorRef: ChangeDetectorRef,
    protected ngZone: NgZone,
    public canvasService: CanvasServicesService,
    public dialog: MatDialog
  ) {
    this.mainSearchForm = new FormGroup({
      search: new FormControl(''),
      availableOnly: new FormControl(false),
      prefixSearch: new FormControl(''),
      suffixSearch: new FormControl(''),
    });
    this.subscribeToCategoriesRootVolume();
    this.getBlogsList();
  }

  ngOnInit(): void {
    this.userStateSubscription = this.userFacadeService.user$
      .pipe(
        map((s) => {
          this.userPoaps = s.poaps;
          const poapRequirement =
            generalConfigurations.poapRequiredTools.category;
          const validPoap = poapRequirement.poapId;
          this.userTokenIds = this.poapService.getPoapTokensByPoapId(
            s.poapTokens,
            validPoap
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.getBlogsListSubscription) {
      this.getBlogsListSubscription.unsubscribe();
      this.getBlogsListSubscription = undefined;
    }
    if (this.getRootVolumeSubscription) {
      this.getRootVolumeSubscription.unsubscribe();
      this.getRootVolumeSubscription = undefined;
    }
    if (this.userStateSubscription) {
      this.userStateSubscription.unsubscribe();
      this.userStateSubscription = undefined;
    }
  }

  subscribeToCategoriesRootVolume() {
    this.getRootVolumeSubscription = this.categoryFacade.getCategoryState$
      .pipe(
        map((s) => {
          this.metadata = s.categoriesMetadata;
          this.categories = s.categoriesMetadata?.categories;
          this.categoriesRootVolume =
            s.categoriesRootVolumeData?.categories_monthly_volume;
          this.topCategories = s.categoriesRootVolumeData?.top_categories;
          this.topSales = s.categoriesRootVolumeData?.top_sales;
          this.recentSales = s.categoriesRootVolumeData?.recent_sales;
        })
      )
      .subscribe();
  }

  performSearch() {
    this.mainHeader.bulksearch.registrationListOpen = false;
    this.mainHeader?.bulksearch?.performBulkSearch(
      false,
      this.searchKeysToChunk
    );
  }

  pretty(name: string) {
    return this.ensService.prettify(name);
  }

  selectDomainSearchType(domainType: DomainTypeEnum) {
    this.mainHeader.bulksearch.domainTypeSelected = domainType;
  }

  getBlogsList() {
    if (this.getBlogsListSubscription) {
      this.getBlogsListSubscription.unsubscribe();
      this.getBlogsListSubscription = undefined;
    }
    const headers = {
      Accept: 'application/xhtml+xml,application/xml',
    };
    const requestOptions = {
      responseType: 'text',
      headers: new HttpHeaders(headers),
    };
    this.getBlogsListSubscription = this.httpClient
      .get(generalConfigurations.frontpageBlogsFeed, requestOptions as any)
      .pipe(
        map((r) => {
          const rssParsed = new XMLParser().parse(r as any);
          this.blogs = rssParsed.rss.channel.item.slice(
            0,
            generalConfigurations.maxBlogsOnHome
          );
        }),
        catchError((e) => {
          this.blogs = false;
          return of(false);
        })
      )
      .subscribe();
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

  getCategoryVolume(category: string, decimals: number = 3) {
    if (this.categoriesRootVolume === undefined) {
      return '...';
    }
    const filteredCategories = this.categoriesRootVolume.filter(
      (c) => c.category === category
    );
    if (filteredCategories.length <= 0) {
      return (0).toFixed(decimals);
    }
    return filteredCategories[0].volume.toFixed(decimals);
  }

  timestampToString(t: number) {
    return t.toString();
  }

  openCategory(category: string) {
    window.open('/#/category/' + category);
  }

  get isCategoryPoapRequired() {
    const poapRequirement = generalConfigurations.poapRequiredTools.category;
    return poapRequirement.required;
  }

  get showCategoryToUser() {
    const poapRequirement = generalConfigurations.poapRequiredTools.category;
    if (
      (this.isCategoryPoapRequired === true &&
        (this.userPoaps === undefined ||
          this.userPoaps.includes(this.requiredPoapsForCategoryDisplay) ===
            false)) ||
      (poapRequirement.allowedIds !== null &&
        poapRequirement.allowedIds.includes(this.userTokenIds[0]) === false)
    ) {
      return false;
    }
    return true;
  }

  get tldTitle() {
    if (this.mainHeader === undefined) {
      return DomainTypeEnum.ENS;
    }
    return generalConfigurations.domainTldTitles[
      this.mainHeader.bulksearch.domainTypeSelected
    ];
  }

  get categoriesSorted() {
    if (this.categoriesRootVolume === undefined) {
      return this.categories;
    }
    const sorted = this.categories
      .map((c) => {
        let categoryFoundMonthlyVolume;
        for (const m of this.categoriesRootVolume) {
          if (m.category === c) {
            categoryFoundMonthlyVolume = m;
          }
        }
        if (categoryFoundMonthlyVolume !== undefined) {
          return categoryFoundMonthlyVolume;
        }
        return {
          category: c,
          volume: 0,
        };
      })
      .sort((a, b) => {
        return b.volume - a.volume;
      })
      .map((c) => {
        return c.category;
      });
    return sorted;
  }

  get categoriesEnabled() {
    return generalConfigurations.enabledTools.category;
  }

  get userData() {
    return this.userFacadeService.userState$.pipe(
      switchMap((s) => {
        if ('walletAddress' in s.user && s.user.walletAddress !== undefined) {
          this.currentUserData = s.user;
          return of(s.user.walletAddress);
        }
        return of(false);
      })
    );
  }

  get searchKeysToChunk() {
    if (this.mainSearchForm === undefined) {
      return null;
    }
    return this.mainHeader.bulksearch.getBulkSearchEntriesFromForm(
      this.mainSearchForm.controls.search.value
    );
  }
}
