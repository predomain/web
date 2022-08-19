import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { select, Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { ENSRegistrationStateModel } from 'src/app/models/states/ens-registration-interfaces';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { EnsService } from 'src/app/services/ens';
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
  @Input() searchKeyword = '';
  registrationListOpen = false;
  registrationListLoaded = false;
  registrationDomains: ENSDomainMetadataModel[] = [];
  bulkSearchOpen = false;
  bulkSearchAdvancedOpen: any = false;
  bulkSearchAvailableOnly: any = false;
  bulkSearchComplete = false;
  bulkSearchAvailableCount = 0;
  bulkSearchBookmarks: ENSDomainMetadataModel[] = [];
  bulkSearchBookmarksShow = false;
  bulkSearchBookmarksLoaded = false;
  bulkSearchResults: ENSDomainMetadataModel[] = [];
  performBulkSearchSubscription;
  bookmarkStateSubscription;
  registrationStateSubscription;

  constructor(
    public bookmarksService: BookmarksServiceService,
    public registrationService: RegistrationServiceService,
    public ensService: EnsService,
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
            this.registrationDomains = registrations;
            this.registrationListLoaded = true;
            if (this.registrationListOpen === true) {
              this.performBulkSearch(
                false,
                this.registrationDomains.map((d) => d.labelName)
              );
            }
          })
        )
        .subscribe();
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

  addToRegistration(domain: ENSDomainMetadataModel) {
    this.registrationFacadeService.upsertRegistration(domain);
  }

  goToRegistration() {
    if (this.bulkSearchResults.length <= 0) {
      this.snackBar.open('There are no domains selected.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 15000000000,
      });
      return;
    }
    if (
      this.bulkSearchResults.filter((d) => d.isAvailable === true).length > 0
    ) {
      this.snackBar.open(
        'Cannot proceed with an already registered domain, pleaes try again.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000000000,
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
            this.bulkSearchBookmarks = bookmarks;
            this.bulkSearchBookmarksLoaded = true;
            if (this.bulkSearchBookmarksShow === true) {
              this.performBulkSearch(
                false,
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

  toggleBookmark(domain: ENSDomainMetadataModel) {
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
    if (this.prefix !== undefined) {
      this.prefix.nativeElement.value = '';
    }
    if (this.suffix !== undefined) {
      this.suffix.nativeElement.value = '';
    }
    this.bulkSearchOpen = !this.bulkSearchOpen;
  }

  getBulkSearchEntriesFromForm(keywordPrefilled = null) {
    let toFind;
    if (this.bulkSearchAdvancedOpen === true) {
      toFind = (document.getElementById('co-bulk-advance-input') as any).value
        .replaceAll('\n', ',')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => d.toLowerCase())
        .filter((d) => this.ensService.isDomainNameNotValid(d) === true);
    } else if (keywordPrefilled !== null) {
      toFind = keywordPrefilled
        .replaceAll(' ', '')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => d.toLowerCase())
        .filter(
          (d) =>
            this.ensService.isDomainNameNotValid(d) === true &&
            d.indexOf('.') <= -1
        );
    } else {
      toFind = (this.searchKeyword as string)
        .replaceAll(' ', '')
        .replaceAll('.eth', '')
        .split(',')
        .map((d) => d.toLowerCase())
        .filter(
          (d) =>
            this.ensService.isDomainNameNotValid(d) === true &&
            d.indexOf('.') <= -1
        );
    }
    if (toFind.length > 1000) {
      this.snackBar.open(
        'Only a maximum of 1000 search entries allowed.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
      return;
    }
    if (this.prefix !== undefined) {
      const prefix = this.prefix.nativeElement.value;
      if (prefix !== '' && prefix !== '') {
        toFind = toFind.map((d) => {
          return prefix + d;
        });
      }
    }
    if (this.suffix !== undefined) {
      const suffix = this.suffix.nativeElement.value;
      if (suffix !== '' && suffix !== '') {
        toFind = toFind.map((d) => {
          return d + suffix;
        });
      }
    }
    toFind = [...new Set(toFind)];
    return toFind;
  }

  performBulkSearch(noSearchFormToggle = false, entries: string[] = null) {
    this.bulkSearchComplete = false;
    this.bulkSearchResults = [];
    this.bulkSearchAvailableCount = 0;
    if (this.performBulkSearchSubscription) {
      this.performBulkSearchSubscription.unsubscribe();
      this.performBulkSearchSubscription = undefined;
    }
    let toFind =
      entries !== null ? entries : this.getBulkSearchEntriesFromForm();
    this.performBulkSearchSubscription = this.ensService
      .findDomains(toFind)
      .subscribe((r) => {
        for (const f of toFind) {
          let found;
          (r as any).registrations.map((d) => {
            if (d.labelName === f && found === undefined) {
              found = d;
            }
          });
          const fData = {
            id: f.toLowerCase(),
            labelName: f.toLowerCase(),
            isAvailable: found === undefined ? false : true,
          } as ENSDomainMetadataModel;
          if (found === undefined) {
            this.bulkSearchAvailableCount++;
          }
          if (found !== undefined) {
            fData.expiry = found.expiryDate;
            const gPeriod = this.ensService.calculateGracePeriodPercentage(
              parseInt(fData.expiry, 10)
            );
            fData.gracePeriodPercent =
              gPeriod < -100 ? undefined : 100 - Math.abs(gPeriod);
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

  getDomainLink(domain: string) {
    return environment.baseUrl + '/#/domain/' + domain;
  }

  get searchResultTitle() {
    if (this.registrationListOpen === true) {
      return 'LABELS.REGISTER';
    } else if (this.bulkSearchBookmarksShow === true) {
      return 'LABELS.BOOKMARKS';
    }
    return 'LABELS.SEARCH_RESULTS';
  }

  get registrationCount() {
    return this.countRegistrations();
  }

  get bookmarksCount() {
    return this.countBookmarks();
  }
}
