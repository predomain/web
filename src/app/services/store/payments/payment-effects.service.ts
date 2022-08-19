import { Injectable } from "@angular/core";
import { MiscUtilsService } from "../../misc-utils";

@Injectable({
  providedIn: "root",
})
export class PaymentEffectsService {
  constructor(protected miscUtils: MiscUtilsService) {}

  recordLastConnectionAddress(connectionAddress: string) {
    localStorage.setItem("ps-last-connection", connectionAddress);
  }

  getLastConnectionAddress() {
    const lConnectionAddres = localStorage.getItem("ps-last-connection");
    if (
      lConnectionAddres === null ||
      lConnectionAddres === "" ||
      lConnectionAddres === undefined
    ) {
      return false;
    }
    return lConnectionAddres;
  }
}
