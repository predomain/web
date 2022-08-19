import {
  NgModule,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { serviceProviders } from '../models';
import { MainHeaderModule, OnboardDialogModule } from './miscs';
import { BootstrapRoutingModule } from './routing';
import { BootstrapComponent } from '../pages/bootstrap';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Intercept } from '../services';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    BootstrapRoutingModule,
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
  declarations: [BootstrapComponent],
  exports: [SharedModule, OnboardDialogModule, MainHeaderModule],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class BootstrapModule {}
