import { of, timer } from 'rxjs';
import { ethers } from 'ethers';
import * as d3 from 'd3';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  delayWhen,
  map,
  retryWhen,
  switchMap,
  take,
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
import { PagesFacadeService } from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DownloadService } from 'src/app/services/download/download.service';
import { HttpClient } from '@angular/common/http';
import { CategoryModel } from 'src/app/models/category';

const globalAny: any = global;

const test = [
  { letter: 'A', frequency: 0.08167 },
  { letter: 'B', frequency: 0.01492 },
  { letter: 'C', frequency: 0.02782 },
  { letter: 'D', frequency: 0.04253 },
  { letter: 'E', frequency: 0.12702 },
  { letter: 'F', frequency: 0.02288 },
  { letter: 'G', frequency: 0.02015 },
  { letter: 'H', frequency: 0.06094 },
  { letter: 'I', frequency: 0.06966 },
  { letter: 'J', frequency: 0.00153 },
  { letter: 'K', frequency: 0.00772 },
  { letter: 'L', frequency: 0.04025 },
  { letter: 'M', frequency: 0.02406 },
  { letter: 'N', frequency: 0.06749 },
  { letter: 'O', frequency: 0.07507 },
  { letter: 'P', frequency: 0.01929 },
  { letter: 'Q', frequency: 0.00095 },
  { letter: 'R', frequency: 0.05987 },
  { letter: 'S', frequency: 0.06327 },
  { letter: 'T', frequency: 0.09056 },
  { letter: 'U', frequency: 0.02758 },
  { letter: 'V', frequency: 0.00978 },
  { letter: 'W', frequency: 0.0236 },
  { letter: 'X', frequency: 0.0015 },
  { letter: 'Y', frequency: 0.01974 },
  { letter: 'Z', frequency: 0.00074 },
];

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
  @ViewChild('expiredPicker') expiredPicker: any;
  @ViewChild('registrationPicker') registrationPicker: any;
  @ViewChild('creationPicker') creationPicker: any;
  placeholders = new Array(10).fill(0);
  pageCategory = this.category + '.' + generalConfigurations.categoriesDomain;
  categoryChart = test;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  hasDomainsListLoaded = false;
  avatarResolved = false;
  displayModes: typeof DisplayModes = DisplayModes;
  displayMode = DisplayModes.CHUNK;
  metadata: CategoryModel;
  profileTexts: any;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  typesFilter = {
    alphabet: false,
    numbers: false,
    emoji: false,
  };
  filterForm: FormGroup;
  userDomains;
  userAddress;
  ethNameData;
  profileTextSubscription;
  activatedRouteSubscription;
  getCategoriesSubscription;

  constructor(
    protected bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected pagesFacade: PagesFacadeService,
    protected registrationDataService: RegistrationDataService,
    protected downloadService: DownloadService,
    protected activatedRoute: ActivatedRoute,
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
    const provider = globalAny.canvasProvider;
    this.getCategoriesSubscription = this.ensService
      .getDomainContentHash(provider, this.pageCategory)
      .pipe(
        switchMap((c) => {
          return this.httpClient.get(c as any);
        }),
        switchMap((r) => {
          if (r === false || r === null) {
            throw false;
          }
          this.metadata = r as CategoryModel;
          this.getProfileTexts();
          return this.getCategoryDomains(this.metadata.valid_names);
        }),
        catchError((e) => {
          this.pagesFacade.setPageCriticalError(true);
          this.pagesFacade.gotoPageRoute('not-found', PagesEnum.NOTFOUND);
          return of(false);
        })
      )
      .subscribe();
  }

  pageReset() {
    this.hasDomainsListLoaded = false;
    this.userDomains = undefined;
    this.userAddress = undefined;
    this.ethNameData = undefined;
  }

  getCategoryDomains(domains: string[]) {
    let retries = 0;
    return this.ensService
      .findDomains(domains.map((r) => r.toLowerCase()))
      .pipe(
        map((r) => {
          this.userDomains = (r as any).registrations
            .filter((d) => {
              return d.domain.labelName !== null;
            })
            .map((d) => {
              try {
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
              } catch (e) {
                throw e;
              }
            })
            .sort((a, b) => b.registrationDate - a.registrationDate);
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
      );
  }

  getProfileTexts() {
    if (
      'profileTexts' in this.metadata &&
      this.metadata.profileTexts !== undefined
    ) {
      this.profileTexts = this.metadata.profileTexts;
      return;
    }
    this.profileTexts = {};
  }

  filterSearchDomains(value: any = '') {
    if (value === undefined || value === '' || value === null) {
      return this.userDomains.filter((d) => {
        return this.extraFilters(d);
      });
    }
    const filterValue = (value as any).toLowerCase();
    return this.userDomains.filter((d) => {
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
}
