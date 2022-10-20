import { of, timer } from 'rxjs';
import { ethers } from 'ethers';
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
  delayWhen,
  map,
  retryWhen,
  switchMap,
  take,
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
  ENSBookmarkFacadeService,
  PagesFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
import {
  BlockExplorersEnum,
  generalConfigurations,
} from 'src/app/configurations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DownloadService } from 'src/app/services/download/download.service';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { select, Store } from '@ngrx/store';
import { getENSBookmarks } from 'src/app/store/selectors';

const globalAny: any = global;

export enum DisplayModes {
  CHUNK,
  AVATAR,
  LINEAR,
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
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('expiredPicker') expiredPicker: any;
  @ViewChild('registrationPicker') registrationPicker: any;
  @ViewChild('creationPicker') creationPicker: any;
  placeholders = new Array(50).fill(0);
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  hasDomainsListLoaded = false;
  avatarResolved = false;
  displayModes: typeof DisplayModes = DisplayModes;
  displayMode = DisplayModes.AVATAR;
  profileTexts: ProfileTexts = {};
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  typesFilter = {
    alphabet: false,
    numbers: false,
    emoji: false,
  };
  filterForm: FormGroup;
  bookmarks: DomainMetadataModel[];
  userDomains;
  userAddress;
  ethNameData;
  getUserDomainsSubscripton;
  profileTextSubscription;
  activatedRouteSubscription;
  bookmarkStateSubscription;

  constructor(
    public bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService,
    protected userService: UserService,
    protected ensService: EnsService,
    protected pagesFacade: PagesFacadeService,
    protected registrationDataService: RegistrationDataService,
    protected bookmarkFacadeService: ENSBookmarkFacadeService,
    protected bookmarkStore: Store<ENSBookmarkStateModel>,
    protected downloadService: DownloadService,
    protected activatedRoute: ActivatedRoute,
    protected miscUtils: MiscUtilsService,
    protected snackBar: MatSnackBar,
    protected router: Router,
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
    });
  }

  ngOnInit(): void {
    this.loadBookmarks();
    if (this.userName === false) {
      return;
    }
    this.activatedRouteSubscription = this.activatedRoute.params
      .pipe(
        map((p) => {
          this.pageReset();
          this.getUserDomains();
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
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
  }

  pageReset() {
    this.hasDomainsListLoaded = false;
    this.profileTexts = {};
    this.userDomains = undefined;
    this.userAddress = undefined;
    this.ethNameData = undefined;
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
            this.pagesFacade.gotoPageRoute('not-found', PagesEnum.NOTFOUND);
            throw false;
          }
          this.userAddress = r;
          return this.userService.getUserDomains((r as string).toLowerCase());
        }),
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
                if (
                  isEthName === true &&
                  d.domain.labelName.toLowerCase() ===
                    this.userName.replace('.eth', '').toLowerCase()
                ) {
                  this.ethNameData = d.domain;
                  this.getProfileTexts();
                }
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
      .getUserText(provider, ethName, 'email')
      .pipe(
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.email = r as string;
          }
          return this.userService.getUserText(provider, ethName, 'description');
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.description = r as string;
          }
          return this.userService.getUserText(provider, ethName, 'keywords');
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.keywords = r as string;
          }
          return this.userService.getUserText(provider, ethName, 'com.discord');
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.discord = r as string;
          }
          return this.userService.getUserText(provider, ethName, 'com.twitter');
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.twitter = r as string;
          }
          return this.userService.getUserText(
            provider,
            ethName,
            'org.telegram'
          );
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.telegram = r as string;
          }
          return this.userService.getUserText(provider, ethName, 'url');
        }),
        switchMap((r) => {
          if (r !== null) {
            this.profileTexts.url = r as string;
          }
          return this.userService.getUserText(
            provider,
            ethName,
            'predomain_banner'
          );
        }),
        map((r) => {
          if (r !== null) {
            this.profileTexts.predomainBanner = r as string;
          }
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

  get userName() {
    if ('user' in this.activatedRoute.snapshot.params === false) {
      return false;
    }
    const user = this.activatedRoute.snapshot.params.user;
    return user;
  }

  get isDeviceMobile() {
    return document.body.clientWidth <= 600;
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
