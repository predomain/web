import { of } from 'rxjs';
import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { switchMap } from 'rxjs/operators';
import { UserModel } from 'src/app/models/states/user-interfaces';
import { EnsService } from 'src/app/services/ens';
import { UserFacadeService } from 'src/app/store/facades';
import { MainHeaderComponent } from 'src/app/widgets/main-header';
import { MiscUtilsService } from 'src/app/services';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @ViewChild('mainHeader') mainHeader: MainHeaderComponent;
  starCount = new Array(10).fill(0);
  currentUserData: UserModel;
  mainSearchForm: FormGroup;

  constructor(
    public ensService: EnsService,
    public miscUtilsService: MiscUtilsService,
    protected userFacadeService: UserFacadeService,
    protected detectorRef: ChangeDetectorRef,
    protected ngZone: NgZone,
    public dialog: MatDialog
  ) {
    this.mainSearchForm = new FormGroup({
      search: new FormControl(''),
      availableOnly: new FormControl(false),
      prefixSearch: new FormControl(''),
      suffixSearch: new FormControl(''),
    });
  }

  performSearch() {
    this.mainHeader.bulksearch.registrationListOpen = false;
    this.mainHeader?.bulksearch?.performBulkSearch(
      false,
      this.searchKeysToChunk
    );
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
