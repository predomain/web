import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { PagesFacadeService } from 'src/app/store/facades';

@Component({
  selector: 'app-generic-dialog',
  templateUrl: './generic-dialog.component.html',
  styleUrls: ['./generic-dialog.component.scss'],
})
export class GenericDialogComponent implements OnInit {
  overlaysCountOnInit = 0;
  closedByButton = false;

  constructor(
    protected router: Router,
    protected pagesFacadeService: PagesFacadeService,
    public genericDialogRef: MatDialogRef<GenericDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      showSpinner?: boolean;
      lightColour?: boolean;
      spinnerSize?: number;
      customIcon?: string;
      subText?: string;
      titleText?: string;
      textAlign?: string;
      buttonTitle?: string;
      buttonLink?: string;
      buttonLinkPageRef?: PagesEnum;
      goToOnExit?: string;
      goToOnExitPage?: PagesEnum;
    }
  ) {}

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

  closeDialog() {
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
    if (this.closedByButton === false && this.data.goToOnExit !== undefined) {
      this.pagesFacadeService.gotoPageRoute(
        this.data.goToOnExit,
        this.data.goToOnExitPage
      );
    }
  }

  goToLink() {
    this.closedByButton = true;
    if (this.data.buttonLink !== undefined) {
      this.pagesFacadeService.gotoPageRoute(
        this.data.buttonLink,
        this.data.buttonLinkPageRef
      );
    }
    this.genericDialogRef.close();
  }

  get textAlign() {
    if (this.data.textAlign === '') {
      return '';
    } else if (this.data.textAlign === 'right') {
      return 'cos-right-text';
    } else if (this.data.textAlign === 'center') {
      return 'cos-center-text';
    }
  }
}
