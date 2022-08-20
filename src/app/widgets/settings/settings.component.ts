import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { RPCProviderModel } from 'src/app/models/rpc/rpc-provider.model';
import { ValidRPCProvidersEnum } from 'src/app/models/rpc/valid-rpc-providers.enum';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesStateModel } from 'src/app/models/states/pages-interfaces';
import {
  PagesFacadeService,
  PaymentFacadeService,
} from 'src/app/store/facades';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  validRpcProviders: typeof ValidRPCProvidersEnum = ValidRPCProvidersEnum;
  overlaysCountOnInit = 0;
  closedByButton = false;
  removingPayentHistory = false;
  settingsForm: FormGroup;
  pagesState: PagesStateModel;
  pagesStateSubscription;

  constructor(
    protected snackBar: MatSnackBar,
    protected pagesFacade: PagesFacadeService,
    protected paymentFacade: PaymentFacadeService,
    public genericDialogRef: MatDialogRef<SettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.settingsForm = new FormGroup({
      providerSelected: new FormControl(this.validRpcProviders.DEFAULT),
      rpc: new FormControl(''),
      rpcId: new FormControl(''),
      rpcSecret: new FormControl(''),
    });
  }

  ngOnDestroy(): void {
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
    }
  }

  ngOnInit() {
    this.setInitialRPCData();
    this.genericDialogRef.backdropClick().subscribe(() => {
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
      this.genericDialogRef.close();
      return;
    }
    this.genericDialogRef.close();
  }

  setInitialRPCData() {
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
    }
    this.pagesStateSubscription = this.pagesFacade.pagesState$
      .pipe(
        map((s) => {
          this.pagesState = s;
          this.parseCurrentRPCData();
        })
      )
      .subscribe();
  }

  parseCurrentRPCData() {
    const rpcData = this.pagesState?.optionalProvider;
    if (rpcData === undefined || rpcData === null) {
      return;
    }
    this.settingsForm.controls.providerSelected.setValue(rpcData.type);
    this.settingsForm.controls.rpc.setValue(rpcData.url);
    this.settingsForm.controls.rpcId.setValue(rpcData.id);
    this.settingsForm.controls.rpcSecret.setValue(rpcData.secret);
  }

  clearPaymentHistory() {
    this.removingPayentHistory = true;
    setTimeout(() => {
      this.removingPayentHistory = false;
      this.paymentFacade.removeAllPayment();
      this.snackBar.open('Payment history cleared.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000,
      });
    }, 1000);
  }

  selectProvider(providerSelected: ValidRPCProvidersEnum) {
    if (providerSelected === ValidRPCProvidersEnum.DEFAULT) {
      this.settingsForm.controls.rpc.setValue('');
    }
    this.settingsForm.controls.providerSelected.setValue(providerSelected);
  }

  changeRPCProvider() {
    const providerType = this.settingsForm.controls.providerSelected.value;
    const providerUrl = this.settingsForm.controls.rpc.value;
    const providerId = this.settingsForm.controls.rpcId.value;
    const providerSecret = this.settingsForm.controls.rpcSecret.value;
    if (providerType === ValidRPCProvidersEnum.DEFAULT) {
      this.pagesFacade.setRpcProvider(undefined);
      return;
    }
    this.pagesFacade.setRpcProvider({
      type: providerType,
      url: providerUrl,
      id: providerId,
      secret: providerSecret,
    } as RPCProviderModel);
  }

  saveChanges() {
    if (this.customRPCSelectionEnabled === true) {
      this.changeRPCProvider();
    }
  }

  get customRPCSelectionEnabled() {
    return generalConfigurations.enableCustomRPC;
  }
}
