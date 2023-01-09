import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { select, Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { DomainMetadataModel } from 'src/app/models/domains';
import { DomainTypeEnum } from 'src/app/models/domains';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { ENSRegistrationStateModel } from 'src/app/models/states/ens-registration-interfaces';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { DownloadService } from 'src/app/services/download/download.service';
import { EnsService } from 'src/app/services/ens';
import { LnrService } from 'src/app/services/lnr';
import { RegistrationServiceService } from 'src/app/services/registration';
import {
  ENSBookmarkFacadeService,
  ENSRegistrationFacadeService,
  PagesFacadeService,
} from 'src/app/store/facades';
import { getENSBookmarks, getENSRegistrations } from 'src/app/store/selectors';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bulk-search',
  templateUrl: './bulk-search.component.html',
  styleUrls: ['./bulk-search.component.scss'],
})
export class BulkSearchComponent implements OnInit, OnDestroy {
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  @ViewChild('prefix') prefix: ElementRef;
  @ViewChild('suffix') suffix: ElementRef;
  @ViewChild('prefixMobile') prefixMobile: ElementRef;
  @ViewChild('suffixMobile') suffixMobile: ElementRef;
  @Input() searchKeyword = '';
  domainTypes: typeof DomainTypeEnum = DomainTypeEnum;
  domainTypeSelected: DomainTypeEnum = DomainTypeEnum.ENS;
  registrationListOpen = false;
  registrationListLoaded = false;
  registrationDomains: DomainMetadataModel[] = [];
  bulkSearchOpen = false;
  bulkSearchAdvancedOpen: any = false;
  bulkSearchAvailableOnly: any = false;
  bulkSearchComplete = false;
  bulkSearchAvailableCount = 0;
  bulkSearchBookmarks: DomainMetadataModel[] = [];
  bulkSearchBookmarksShow = false;
  bulkSearchBookmarksLoaded = false;
  skipNormalisation = false;
  bulkSearchResults: DomainMetadataModel[] = [];
  performBulkSearchSubscription;
  bookmarkStateSubscription;
  registrationStateSubscription;

  constructor(
    public bookmarksService: BookmarksServiceService,
    public registrationService: RegistrationServiceService,
    public ensService: EnsService,
    public lnrService: LnrService,
    protected downloadService: DownloadService,
    protected bookmarkStore: Store<ENSBookmarkStateModel>,
    protected registrationStore: Store<ENSRegistrationStateModel>,
    protected bookmarkFacadeService: ENSBookmarkFacadeService,
    protected registrationFacadeService: ENSRegistrationFacadeService,
    protected pagesFacadeServce: PagesFacadeService,
    protected snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBookmarks();
    this.loadRegistrations();
  }

  ngOnDestroy(): void {
    if (this.performBulkSearchSubscription) {
      this.performBulkSearchSubscription.unsubscribe();
    }
    if (this.bookmarkStateSubscription) {
      this.bookmarkStateSubscription.unsubscribe();
    }
    if (this.registrationStateSubscription) {
      this.registrationStateSubscription.unsubscribe();
    }
  }
  /*********************
   *
   * Registration tools
   *
   *********************/
  countRegistrations() {
    return this.registrationService.countRegistrations();
  }

  loadRegistrations() {
    this.registrationStateSubscription =
      this.registrationFacadeService.getENSRegistrationState$
        .pipe(
          withLatestFrom(
            this.registrationStore.pipe(select(getENSRegistrations))
          ),
          map((state) => {
            const [registrationState, registrations] = state;
            let hasDomainsBeenRemovedFromBasket = false;
            if (this.registrationDomains.length > 0) {
              hasDomainsBeenRemovedFromBasket =
                registrations.length < this.registrationDomains.length;
            }
            this.registrationDomains = registrations;
            this.registrationListLoaded = true;
            if (this.registrationListOpen === true) {
              this.performBulkSearch(
                hasDomainsBeenRemovedFromBasket === true,
                this.registrationDomains.map((d) => d.labelName)
              );
            }
          })
        )
        .subscribe();
  }

  removeAllRegistrations() {
    this.registrationFacadeService.removeAllRegistrations();
  }

  removeRegistrations(domain: string) {
    this.registrationFacadeService.removeRegistration(
      this.registrationDomains.filter((d) => d.labelName === domain)[0]
    );
  }

  showRegistrations(resultResultAlreadyOpened = true) {
    this.bulkSearchBookmarksShow = false;
    this.registrationListOpen = true;
    const currentRegistrationToAssess = this.registrationDomains.map(
      (d) => d.labelName
    );
    this.performBulkSearch(
      resultResultAlreadyOpened === true ? false : true,
      currentRegistrationToAssess
    );
  }

  addToRegistration(domain: DomainMetadataModel) {
    if (
      this.registrationDomains.length >=
      generalConfigurations.maxDomainsToRegister
    ) {
      this.snackBar.open(
        'Only a maximum of ' +
          generalConfigurations.maxDomainsToRegister +
          ' domains can be registered.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
      return;
    }
    this.registrationFacadeService.upsertRegistration(domain);
  }

  addAllToRegistration() {
    if (
      this.registrationDomains.length + this.bulkSearchResults.length >
      generalConfigurations.maxDomainsToRegister
    ) {
      this.snackBar.open(
        'Only a maximum of ' +
          generalConfigurations.maxDomainsToRegister +
          ' domains can be registered.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
      return;
    }
    this.snackBar.open('Domains added to cart.', 'close', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 5000,
    });

    const alreadyInCart = this.registrationDomains.map((d) => d.labelName);
    const validForRegistration = this.bulkSearchResults
      .filter((d) => {
        return d.isNotAvailable === false;
      })
      .filter((d) => {
        return alreadyInCart.includes(d.labelName) === false;
      });
    this.registrationFacadeService.upsertAllRegistration(validForRegistration);
  }

  goToRegistration() {
    if (this.bulkSearchResults.length <= 0) {
      this.snackBar.open('There are no domains selected.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      });
      return;
    }
    if (
      this.bulkSearchResults.filter(
        (d) => d.isNotAvailable === true && d.gracePeriodPercent < 99.99
      ).length > 0
    ) {
      this.snackBar.open(
        'Cannot proceed with an already registered domain, pleaes try again.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 5000,
        }
      );
      return;
    }
    this.pagesFacadeServce.gotoPageRoute('checkout', PagesEnum.CHECKOUT);
  }

  /*********************
   *
   * Bulk Search tools
   *
   *********************/
  downloadBookmarks() {
    const csv = this.ensService.downloadDomainsListNamesOnly(
      this.bulkSearchResults
    );
    this.downloadService.download(
      'data:application/octet-stream,' + csv,
      csv,
      'domains-list.txt'
    );
  }

  shareBookmarks() {
    const csv = this.ensService.downloadDomainsListNamesOnly(
      this.bulkSearchResults
    );
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: csv,
      });
    }
  }

  performOnlyBulkSearch() {
    this.registrationListOpen = false;
    this.bulkSearchBookmarksShow = false;
    this.performBulkSearch();
  }

  loadBookmarks() {
    this.bookmarkStateSubscription =
      this.bookmarkFacadeService.getENSBookmarkState$
        .pipe(
          withLatestFrom(this.bookmarkStore.pipe(select(getENSBookmarks))),
          map((state) => {
            const [bookmarkState, bookmarks] = state;
            let hasDomainsBeenRemovedFromBookmark = false;
            if (this.bulkSearchBookmarks.length > 0) {
              hasDomainsBeenRemovedFromBookmark =
                bookmarks.length < this.bulkSearchBookmarks.length;
            }
            this.bulkSearchBookmarks = bookmarks;
            this.bulkSearchBookmarksLoaded = true;
            if (this.bulkSearchBookmarksShow === true) {
              this.performBulkSearch(
                hasDomainsBeenRemovedFromBookmark === true,
                this.bulkSearchBookmarks.map((d) => d.labelName)
              );
            }
          })
        )
        .subscribe();
  }

  showBookmarks(resultResultAlreadyOpened = true) {
    this.bulkSearchComplete = false;
    this.registrationListOpen = false;
    this.bulkSearchResults = [];
    this.bulkSearchAvailableCount = 0;
    this.bulkSearchBookmarksShow = true;
    const currentBookMarkToAssess = this.bulkSearchBookmarks.map(
      (d) => d.labelName
    );
    this.performBulkSearch(
      resultResultAlreadyOpened === true ? false : true,
      currentBookMarkToAssess
    );
  }

  countBookmarks() {
    return this.bookmarksService.countBookmarks();
  }

  removeAllBookmarks() {
    this.bookmarkFacadeService.removeAllBookmarks();
  }

  addAllToBookmark() {
    this.snackBar.open('Bookmarks added.', 'close', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 5000,
    });
    const alreadyBookmarked = this.bulkSearchBookmarks.map((d) => d.labelName);
    const validForBookmarking = this.bulkSearchResults.filter((d) => {
      return alreadyBookmarked.includes(d.labelName) === false;
    });
    this.bookmarkFacadeService.upsertAllBookmark(validForBookmarking);
  }

  toggleBookmark(domain: DomainMetadataModel) {
    if (
      this.bookmarksService.isDomainBookmarked(
        this.bulkSearchBookmarks,
        domain.labelName
      ) === true
    ) {
      this.bookmarkFacadeService.removeBookmark(domain);
      return;
    }
    this.bookmarkFacadeService.upsertBookmark(domain);
  }

  toggleBulkSearch(advanced = false) {
    if (advanced === true) {
      this.bulkSearchAdvancedOpen = !this.bulkSearchAdvancedOpen;
      return;
    }
    this.bulkSearchOpen = !this.bulkSearchOpen;
  }

  getBulkSearchEntriesFromForm(keywordPrefilled = null) {
    let prefixed = false;
    let suffixed = false;
    let prefixedOrSuffixed = false;
    let prefixedAndSuffixed = false;
    let toFind;
    if (
      (this.prefix !== undefined && this.prefix.nativeElement.value !== '') ||
      (this.prefixMobile !== undefined &&
        this.prefixMobile.nativeElement.value !== '')
    ) {
      prefixed = true;
    }
    if (
      (this.suffix !== undefined && this.suffix.nativeElement.value !== '') ||
      (this.suffixMobile !== undefined &&
        this.suffixMobile.nativeElement.value !== '')
    ) {
      suffixed = true;
    }
    prefixedOrSuffixed =
      (prefixed === true || suffixed === true) === true &&
      (prefixed === true && suffixed === true) === false
        ? true
        : false;
    prefixedAndSuffixed = (prefixed === true && suffixed === true) === true;
    if (this.bulkSearchAdvancedOpen === true) {
      toFind = (document.getElementById('co-bulk-advance-input') as any).value
        .replaceAll('\n', ',')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => (this.skipNormalisation === true ? d : d.toLowerCase()))
        .filter(
          (d) =>
            this.ensService.isDomainNameNotValid(
              d,
              prefixedOrSuffixed,
              prefixedAndSuffixed,
              this.domainTypeSelected === DomainTypeEnum.LNR ? 1 : 3,
              this.skipNormalisation
            ) === true
        );
    } else if (keywordPrefilled !== null) {
      toFind = keywordPrefilled
        .replaceAll(' ', '')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => (this.skipNormalisation === true ? d : d.toLowerCase()))
        .filter(
          (d) =>
            this.ensService.isDomainNameNotValid(
              d,
              prefixedOrSuffixed,
              prefixedAndSuffixed,
              this.domainTypeSelected === DomainTypeEnum.LNR ? 1 : 3,
              this.skipNormalisation
            ) === true && d.indexOf('.') <= -1
        );
    } else {
      toFind = (this.searchKeyword as string)
        .replaceAll(' ', '')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => (this.skipNormalisation === true ? d : d.toLowerCase()))
        .filter(
          (d) =>
            this.ensService.isDomainNameNotValid(
              d,
              prefixedOrSuffixed,
              prefixedAndSuffixed,
              this.domainTypeSelected === DomainTypeEnum.LNR ? 1 : 3,
              this.skipNormalisation
            ) === true && d.indexOf('.') <= -1
        );
    }
    if (
      toFind.length >
      generalConfigurations.maxDomainSearch[this.domainTypeSelected]
    ) {
      this.snackBar.open(
        'Only a maximum of ' +
          generalConfigurations.maxDomainSearch[this.domainTypeSelected] +
          ' search entries allowed.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
      return;
    }
    if (
      (this.prefix !== undefined && this.prefix.nativeElement.value !== '') ||
      (this.prefixMobile !== undefined &&
        this.prefixMobile.nativeElement.value !== '')
    ) {
      const prefix =
        this.prefixMobile !== undefined &&
        this.prefixMobile.nativeElement.value !== ''
          ? this.prefixMobile.nativeElement.value
          : this.prefix.nativeElement.value;
      if (prefix !== '' && prefix !== '') {
        toFind = toFind.map((d) => {
          return prefix + d;
        });
      }
    }
    if (
      (this.suffix !== undefined && this.suffix.nativeElement.value !== '') ||
      (this.suffixMobile !== undefined &&
        this.suffixMobile.nativeElement.value !== '')
    ) {
      const suffix =
        this.suffixMobile !== undefined &&
        this.suffixMobile.nativeElement.value !== ''
          ? this.suffixMobile.nativeElement.value
          : this.suffix.nativeElement.value;
      if (suffix !== '' && suffix !== '') {
        toFind = toFind.map((d) => {
          return d + suffix;
        });
      }
    }
    toFind = [...new Set(toFind)];
    return toFind.map((n) => {
      if (this.skipNormalisation === true) {
        return n;
      }
      return this.ensService.performNormalisation(n);
    });
  }

  performBulkSearch(noSearchFormToggle = false, entries: string[] = null) {
    this.bulkSearchComplete = false;
    this.bulkSearchResults = [];
    this.bulkSearchAvailableCount = 0;
    if (this.performBulkSearchSubscription) {
      this.performBulkSearchSubscription.unsubscribe();
      this.performBulkSearchSubscription = undefined;
    }
    const now = parseInt((new Date().getTime() / 1000).toString());
    let toFind =
      entries !== null ? entries : this.getBulkSearchEntriesFromForm();
    this.performBulkSearchSubscription = (
      this.domainTypeSelected === DomainTypeEnum.LNR
        ? this.lnrService
        : this.ensService
    )
      .findDomains(toFind)
      .subscribe((r) => {
        for (const f of toFind) {
          let found;
          if (this.domainTypeSelected === DomainTypeEnum.ENS) {
            (r as any).registrations.map((d) => {
              if (d.labelName === f && found === undefined) {
                found = d;
              }
            });
          } else if (this.domainTypeSelected === DomainTypeEnum.LNR) {
            (r as any).map((d) => {
              if (d.labelName === f && found === undefined) {
                found = d;
              }
            });
          }
          const isDomainPastGracePeriod =
            found === undefined
              ? false
              : now >
                parseInt(found.expiryDate) +
                  this.ensService.gracePeriodInSeconds +
                  this.ensService.premiumPeriodInSeconds;
          const fData = {
            id: this.skipNormalisation === true ? f : f.toLowerCase(),
            labelName: this.skipNormalisation === true ? f : f.toLowerCase(),
            domainType: this.domainTypeSelected,
            isNotAvailable:
              isDomainPastGracePeriod === true || found === undefined
                ? false
                : true,
          } as DomainMetadataModel;
          if (found === undefined) {
            this.bulkSearchAvailableCount++;
          }
          if (found !== undefined) {
            fData.expiry =
              isDomainPastGracePeriod === true ? null : found.expiryDate;
            const gPeriod = this.ensService.calculateGracePeriodPercentage(
              parseInt(fData.expiry, 10)
            );
            fData.gracePeriodPercent =
              gPeriod < -100 || isDomainPastGracePeriod === true
                ? 0
                : 100 - Math.abs(gPeriod);
          }
          this.bulkSearchResults.push(fData);
        }
        this.bulkSearchComplete = true;
      });
    if (noSearchFormToggle === true) {
      return;
    }
    this.toggleBulkSearch();
  }

  changeDomainType(domainType: DomainTypeEnum) {
    this.domainTypeSelected = domainType;
    this.skipNormalisation =
      !generalConfigurations.domainNormalisationRequired.includes(
        this.domainTypeSelected
      );
  }

  openPremiumPage(domain: string) {
    const link =
      environment.networks[environment.defaultChain].ensApp +
      '/name/' +
      domain +
      '.eth/register';
    window.location.href = link;
  }

  getDomainLink(domain: string) {
    return environment.baseUrl + '/#/domain/' + domain;
  }

  pretty(name: string) {
    if (this.skipNormalisation === true) {
      return name;
    }
    return this.ensService.prettify(name);
  }

  get bulkSearchItemLogo() {
    const iClass = {
      'co-bulk-search-item-fill-progress-bar-gap': true,
    };
    if (this.domainTypeSelected === DomainTypeEnum.ENS) {
      iClass['ENS'] = true;
    }
    return iClass;
  }

  get canDomainTypeBeRegistered() {
    return generalConfigurations.domainsCanBeRegistered.includes(
      this.domainTypeSelected
    );
  }

  get searchResultTitle() {
    if (this.registrationListOpen === true) {
      return 'LABELS.REGISTER';
    } else if (this.bulkSearchBookmarksShow === true) {
      return 'LABELS.BOOKMARKS';
    }
    return 'LABELS.SEARCH_RESULTS';
  }

  get maxDomainsSearch() {
    return generalConfigurations.maxDomainSearch[this.domainTypeSelected];
  }

  get domainsOnSearch() {
    if (
      (document.getElementById('co-bulk-advance-input') as any).value === ''
    ) {
      return 0;
    }
    return (
      document.getElementById('co-bulk-advance-input') as any
    ).value.split('\n').length;
  }

  get registrationCount() {
    return this.countRegistrations();
  }

  get bookmarksCount() {
    return this.countBookmarks();
  }

  get nameExtension() {
    return generalConfigurations.domainExtensions[this.domainTypeSelected];
  }
}
