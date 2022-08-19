import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { InputTypesEnum } from 'src/app/models/custom-adderss-dialog';
import { PagesStateModel } from 'src/app/models/states/pages-interfaces';
import { UserModel } from 'src/app/models/states/user-interfaces';
import { UserService } from 'src/app/services';
import { PagesFacadeService, UserFacadeService } from 'src/app/store/facades';
import { WalletService } from '../../services/wallet/wallet.service';

const globalAny: any = global;

@Component({
  selector: 'app-custom-address',
  templateUrl: './custom-address.component.html',
  styleUrls: ['./custom-address.component.scss'],
})
export class CustomAddressComponent implements OnInit, OnDestroy {
  inputTypes: typeof InputTypesEnum = InputTypesEnum;
  textInput = new Subject<string>();
  overlaysCountOnInit = 0;
  closedByButton = false;
  invalidEntry = false;
  formLock = false;
  pagesStateSubscription;
  userServiceSubscription;
  pagesState: PagesStateModel;
  addressForm: FormGroup;

  constructor(
    public networkStatusDialogRef: MatDialogRef<CustomAddressComponent>,
    public userFacade: UserFacadeService,
    public walletSerivce: WalletService,
    public userService: UserService,
    public pagesFacadeService: PagesFacadeService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      label: string;
      errorLabel: string;
      defaultValue: string;
      inputType: InputTypesEnum;
    }
  ) {
    this.addressForm = new FormGroup({
      address: new FormControl(data.defaultValue),
    });
  }

  ngOnDestroy(): void {
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
      this.pagesStateSubscription = undefined;
    }
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
      this.userServiceSubscription = undefined;
    }
  }

  ngOnInit() {
    this.pagesStateSubscription = this.pagesFacadeService.pagesState$
      .pipe(
        map((s) => {
          this.pagesState = s;
        })
      )
      .subscribe();
    this.networkStatusDialogRef.backdropClick().subscribe(() => {
      if (this.closedByButton === true) {
        return;
      }
      this.closeDialog();
    });
    const overlays = document.getElementsByClassName(
      'cdk-overlay-dark-backdrop'
    );
    const wrappers = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );
    this.overlaysCountOnInit = overlays.length;
    if (overlays.length > 1) {
      for (let i = 1; i < overlays.length; i++) {
        overlays[i].remove();
      }
      const attr = document.createAttribute('style');
      attr.value = 'z-index: 1001 !important;';
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr =
        wrappers[wrappers.length - 1].attributes.getNamedItem('style');
      const newAttr = document.createAttribute('style');
      newAttr.value = existingAttr.value + ' z-index: 1001 !important;';
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      return;
    }
  }

  closeDialog() {
    this.closedByButton = true;
    const overlays = document.getElementsByClassName(
      'cdk-overlay-dark-backdrop'
    );
    const wrappers = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );
    if (this.overlaysCountOnInit > 1) {
      const attr = document.createAttribute('style');
      attr.value = 'z-index: 1000 !important;';
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr =
        wrappers[wrappers.length - 1].attributes.getNamedItem('style');
      const newAttr = document.createAttribute('style');
      newAttr.value = existingAttr.value + ' z-index: 1001 !important;';
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      this.networkStatusDialogRef.close();
      return;
    }
    this.networkStatusDialogRef.close();
  }

  apply() {
    this.textInput.next(this.addressForm.controls.address.value);
    this.formLock = true;
  }
}
