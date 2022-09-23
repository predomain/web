import { of } from 'rxjs';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { map, switchMap } from 'rxjs/operators';
import { UserModel } from 'src/app/models/states/user-interfaces';
import { EnsService } from 'src/app/services/ens';
import { UserFacadeService } from 'src/app/store/facades';
import { MainHeaderComponent } from 'src/app/widgets/main-header';
import { MiscUtilsService } from 'src/app/services';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { generalConfigurations } from 'src/app/configurations';

const globalAny: any = global;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  @ViewChild('mainHeader') mainHeader: MainHeaderComponent;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  placeholders = new Array(20).fill(0);
  categories;
  metadata;
  currentUserData: UserModel;
  mainSearchForm: FormGroup;
  donationBoxOpen = true;
  loadingCategories = true;
  getCategoriesSubscription;

  constructor(
    public ensService: EnsService,
    public miscUtilsService: MiscUtilsService,
    protected httpClient: HttpClient,
    protected userFacadeService: UserFacadeService,
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
    if (generalConfigurations.enabledTools.category === true) {
      this.getCategories();
    }
  }

  ngOnDestroy(): void {
    if (this.getCategoriesSubscription) {
      this.getCategoriesSubscription.unsubscribe();
      this.getCategoriesSubscription = undefined;
    }
  }

  getCategories() {
    if (this.getCategoriesSubscription) {
      this.getCategoriesSubscription.unsubscribe();
      this.getCategoriesSubscription = undefined;
    }
    const provider = globalAny.canvasProvider;
    this.getCategoriesSubscription = this.ensService
      .getDomainContentHash(provider, generalConfigurations.categoriesDomain)
      .pipe(
        switchMap((c) => {
          return this.httpClient.get(c as any);
        }),
        map((r) => {
          this.loadingCategories = false;
          const categoryMetdata = r as any;
          this.categories = categoryMetdata.categories;
          this.metadata = categoryMetdata;
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

  goToDonate() {
    window.open('https://gitcoin.co/grants/6743/predomain-project', '_blank');
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
