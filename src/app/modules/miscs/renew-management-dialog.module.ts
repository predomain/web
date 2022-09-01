import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { SharedModule } from '../shared.module';
import { IconModule } from './icon.module';
import { RenewManagementComponent } from 'src/app/widgets/renew-management/renew-management.component';

@NgModule({
  imports: [
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    IconModule,
    SharedModule,
  ],
  providers: [...serviceProviders],
  declarations: [RenewManagementComponent],
  exports: [
    RenewManagementComponent,
    TranslationModule,
    IconModule,
    FlexLayoutModule,
  ],
  bootstrap: [],
  entryComponents: [RenewManagementComponent],
  schemas: [],
})
export class RenewManagementDialogModule {}
