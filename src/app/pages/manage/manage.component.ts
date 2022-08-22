import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { PaymentStateModel } from 'src/app/models/states/payment-interfaces';
import {
  PagesFacadeService,
  PaymentFacadeService,
} from 'src/app/store/facades';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';

const globalAny: any = global;

export interface PaymentsListOnDashboardModel {
  id: number;
  name: string;
  expiry: string;
  action: string;
}

const EMPTY_DATA: PaymentsListOnDashboardModel[] = [
  {
    id: null,
    name: '',
    expiry: '',
    action: '',
  },
];

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss'],
})
export class ManageComponent implements OnInit {
  starCount = new Array(3).fill(0);
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  displayedColumns: string[] = ['name', 'expiry', 'action'];
  dataSource = EMPTY_DATA;
  paymentState: PaymentStateModel;
  userDomains: ENSDomainMetadataModel[];
  paymentStateSubscription;
  getUserDomainsSubscripton;

  constructor(
    protected pagesFacade: PagesFacadeService,
    protected paymentFacadeService: PaymentFacadeService,
    public canvasService: CanvasServicesService
  ) {}

  ngOnInit(): void {
    this.paymentStateSubscription = this.paymentFacadeService.paymentState$
      .pipe(
        map((s) => {
          this.paymentState = s;
        })
      )
      .subscribe();
  }

  goToHome() {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }
}
