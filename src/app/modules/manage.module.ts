import {
  NgModule,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { serviceProviders } from '../models';
import { MainHeaderModule, OnboardDialogModule } from './miscs';
import { Intercept } from '../services';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from './shared.module';
import { ManageRoutingModule } from './routing';
import { ManageComponent } from '../pages/manage/manage.component';

@NgModule({
  imports: [
    SharedModule,
    ManageRoutingModule,
    OnboardDialogModule,
    MainHeaderModule,
  ],
  providers: [
    ...serviceProviders,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Intercept,
      multi: true,
    },
  ],
  declarations: [ManageComponent],
  exports: [SharedModule, OnboardDialogModule, MainHeaderModule],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageModule {}
