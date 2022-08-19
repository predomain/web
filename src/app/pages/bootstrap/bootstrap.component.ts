import { Component, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { PagesEnum } from '../../models/states/pages-interfaces';
import { PagesFacadeService } from '../../store/facades';
import { BootController } from '../../../boot-control';

@Component({
  selector: 'app-bootstrap',
  templateUrl: './bootstrap.component.html',
  styleUrls: ['./bootstrap.component.scss'],
})
export class BootstrapComponent implements OnDestroy, AfterViewInit {
  constructor(
    protected pagesFacade: PagesFacadeService,
    protected ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  resetBootstrap() {
    this.ngZone.runOutsideAngular(() => {
      console.log('App restarted.');
      BootController.getbootControl().restart();
    });
  }

  ngOnDestroy() {}
}
