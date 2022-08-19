import { PaymentModel } from "../states/payment-interfaces";

export interface PaymentLogsModel {
  [yearMonthDay: string]: {
    logs: PaymentModel[];
    dateString: string;
  };
}
