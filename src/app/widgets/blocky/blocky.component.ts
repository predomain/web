import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import * as blockies from "blockies-ts";

@Component({
  selector: "app-blocky",
  templateUrl: "./blocky.component.html",
  styleUrls: ["./blocky.component.scss"],
})
export class BlockyComponent implements OnInit, OnChanges {
  @Input() walletAddress = "";
  @Input() roundedCorners = false;
  currentAddress;
  blockyData;

  constructor() {}

  ngOnInit() {
    this.createBlocky();
  }

  createBlocky() {
    this.blockyData = blockies
      .create({
        seed: this.walletAddress.toLowerCase(),
      })
      .toDataURL();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.currentAddress !== this.walletAddress) {
      this.createBlocky();
      this.currentAddress = this.walletAddress;
    }
  }
}
