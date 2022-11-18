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
import { CategoryComponent } from '../pages/category/category.component';
import { CategoryRoutingModule } from './routing';
import { BarModule, DotModule } from './miscs/charts';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@NgModule({
  imports: [
    SharedModule,
    CategoryRoutingModule,
    BarModule,
    DotModule,
    OnboardDialogModule,
    MainHeaderModule,
    PickerModule,
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
  declarations: [CategoryComponent],
  exports: [SharedModule, FooterModule, OnboardDialogModule, MainHeaderModule],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryModule {}
