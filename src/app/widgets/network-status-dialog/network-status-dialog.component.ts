import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-network-status-dialog",
  templateUrl: "./network-status-dialog.component.html",
  styleUrls: ["./network-status-dialog.component.scss"],
})
export class NetworkStatusDialogComponent implements OnInit {
  overlaysCountOnInit = 0;
  closedByButton = false;
  constructor(
    public networkStatusDialogRef: MatDialogRef<NetworkStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: boolean
  ) {}

  ngOnInit() {
    this.networkStatusDialogRef.backdropClick().subscribe(() => {
      if (this.closedByButton === true) {
        return;
      }
      this.closeDialog();
    });
    const overlays = document.getElementsByClassName(
      "cdk-overlay-dark-backdrop"
    );
    const wrappers = document.getElementsByClassName(
      "cdk-global-overlay-wrapper"
    );
    this.overlaysCountOnInit = overlays.length;
    if (overlays.length > 1) {
      for (let i = 1; i < overlays.length; i++) {
        overlays[i].remove();
      }
      const attr = document.createAttribute("style");
      attr.value = "z-index: 1001 !important;";
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr = wrappers[
        wrappers.length - 1
      ].attributes.getNamedItem("style");
      const newAttr = document.createAttribute("style");
      newAttr.value = existingAttr.value + " z-index: 1001 !important;";
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      return;
    }
  }

  closeDialog() {
    this.closedByButton = true;
    const overlays = document.getElementsByClassName(
      "cdk-overlay-dark-backdrop"
    );
    const wrappers = document.getElementsByClassName(
      "cdk-global-overlay-wrapper"
    );
    if (this.overlaysCountOnInit > 1) {
      const attr = document.createAttribute("style");
      attr.value = "z-index: 1000 !important;";
      overlays[0].attributes.setNamedItem(attr);
      const existingAttr = wrappers[
        wrappers.length - 1
      ].attributes.getNamedItem("style");
      const newAttr = document.createAttribute("style");
      newAttr.value = existingAttr.value + " z-index: 1001 !important;";
      wrappers[wrappers.length - 1].attributes.setNamedItem(newAttr);
      this.networkStatusDialogRef.close();
      return;
    }
    this.networkStatusDialogRef.close();
  }
}
