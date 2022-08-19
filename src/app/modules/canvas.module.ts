import {
  NgModule,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CanvasRoutingModule } from './routing';
import { serviceProviders } from '../models';
import { MainHeaderModule, OnboardDialogModule } from './miscs';
import { Intercept } from '../services';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CanvasComponent } from '../pages/canvas/canvas.component';
import { SharedModule } from './shared.module';

@NgModule({
  imports: [
    SharedModule,
    CanvasRoutingModule,
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
  declarations: [CanvasComponent],
  exports: [SharedModule, OnboardDialogModule, MainHeaderModule],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class CanvasModule {}
