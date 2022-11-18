import {
  NgModule,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { serviceProviders } from '../models';
import { FooterModule, MainHeaderModule, OnboardDialogModule } from './miscs';
import { Intercept } from '../services';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from './shared.module';
import { NotFoundRoutingModule } from './routing';
import { NotFoundComponent } from '../pages/not-found';

@NgModule({
  imports: [
    SharedModule,
    NotFoundRoutingModule,
    OnboardDialogModule,
    MainHeaderModule,
    FooterModule,
  ],
  providers: [
    ...serviceProviders,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Intercept,
      multi: true,
    },
  ],
  declarations: [NotFoundComponent],
  exports: [
    SharedModule,
    FooterModule,
    OnboardDialogModule,
    MainHeaderModule,
    FooterModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class NotFoundModule {}
