import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

declare var cordova;

export class BottomSheetSwipeToCloseDirective {
  resetTopPosition = false;
  closedByButton = false;
  dragStartTime = new Date().getTime();

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: any,
    public dialog: MatDialog,
    public ref: MatBottomSheetRef,
    public overlay: Overlay
  ) {}

  /**
   * A hack that pushes the overlay-pane higher (some components are pushed down)
   */
  bumpBottomPosition() {
    const pane = (this.overlay.position() as any)._overlayContainer
      ._containerElement.lastElementChild.lastElementChild as Element;

    if (typeof cordova === 'undefined') {
      pane.setAttribute(
        'class',
        'cdk-overlay-pane cdk-overlay-pane-bumbped-up'
      );
    } else if (cordova.platformId === 'browser') {
      pane.setAttribute(
        'class',
        'cdk-overlay-pane cdk-overlay-pane-bumbped-up'
      );
    } else {
      pane.setAttribute(
        'class',
        'cdk-overlay-pane cdk-overlay-pane-bumbped-up-mobile'
      );
    }
  }

  onDragStart(e: CdkDragStart) {
    this.dragStartTime = new Date().getTime();
  }

  onDragEnded(e: CdkDragEnd) {
    const dragEndTime = new Date().getTime();
    const offset = { ...(<any>e.source._dragRef)._passiveTransform };
    const boundaryHeight = (<any>e.source._dragRef)._boundaryRect.bottom;
    const toCloseThreshold = ((boundaryHeight / 100) * 30) / 2;
    if (offset.y > toCloseThreshold) {
      this.cancelSelect();
    } else if (this.closedByButton === false) {
      const swipeDistance = offset.y;
      const minimumAcceptedSwipeDistance = 15;
      const minimumAcceptedSwipeTime = 150;
      if (
        dragEndTime - this.dragStartTime < minimumAcceptedSwipeTime &&
        swipeDistance > minimumAcceptedSwipeDistance
      ) {
        this.cancelSelect();
        return;
      }
      this.resetTopPosition = true;
      setTimeout(() => {
        e.source._dragRef.reset();
        this.resetTopPosition = false;
      }, 250);
    }
  }

  cancelSelect() {
    this.closedByButton = true;
    this.ref.dismiss(null);
  }
}
