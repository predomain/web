import {
  NgModule,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { serviceProviders } from '../models';
import {
  FooterModule,
  MainHeaderModule,
  OnboardDialogModule,
  SaleManagementDialogModule,
} from './miscs';
import { Intercept } from '../services';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from './shared.module';
import { ProfileRoutingModule } from './routing';
import { ProfileComponent } from '../pages/profile/profile.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FeaturedManagementDialogModule } from './miscs/featured-management-dialog.module';
import { SetupManagementDialogModule } from './miscs/setup-management-dialog.module';

@NgModule({
  imports: [
    SharedModule,
    ProfileRoutingModule,
    OnboardDialogModule,
    MainHeaderModule,
    PickerModule,
    SaleManagementDialogModule,
    FooterModule,
    FeaturedManagementDialogModule,
    SetupManagementDialogModule,
  ],
  providers: [
    ...serviceProviders,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Intercept,
      multi: true,
    },
  ],
  declarations: [ProfileComponent],
  exports: [
    SharedModule,
    OnboardDialogModule,
    SaleManagementDialogModule,
    MainHeaderModule,
    ProfileComponent,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileModule {}
