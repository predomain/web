import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { thirdPartyMarketplacesConfigurations } from 'src/app/configurations';
import { DomainMetadataModel } from 'src/app/models/domains';
import { ThirdpartyMarketplaceModel } from 'src/app/models/marketplace';
import { MiscUtilsService } from 'src/app/services';
import { EnsService } from 'src/app/services/ens';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sale-management',
  templateUrl: './sale-management.component.html',
  styleUrls: ['./sale-management.component.scss'],
})
export class SaleManagementComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatAccordion;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  renewing = false;
  renewComplete = false;
  closedByButton = false;
  overlaysCountOnInit = 0;
  marketplacesList;
  domain: DomainMetadataModel;

  constructor(
    protected ensService: EnsService,
    protected miscUtilsService: MiscUtilsService,
    public genericDialogRef: MatDialogRef<SaleManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.marketplacesList = this.miscUtilsService.shuffleArray(
      thirdPartyMarketplacesConfigurations
    );
  }

  ngOnInit() {
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

  ngOnDestroy(): void {}

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

  pretty(name: string) {
    try {
      const prettified = this.ensService.prettify(name);
      return prettified;
    } catch (e) {
      return name;
    }
  }

  goToMarketplace(marketplace: ThirdpartyMarketplaceModel) {
    window.open(
      marketplace.url +
        '/' +
        marketplace.assetLinks[this.domain.domainType] +
        '/' +
        marketplace.assetLinksProcessor[this.domain.domainType](
          this.domain[marketplace.assetLinksKey[this.domain.domainType]] +
            marketplace.assetLinksKeyExtraInfo[this.domain.domainType]
        ),
      '_self'
    );
  }
}
