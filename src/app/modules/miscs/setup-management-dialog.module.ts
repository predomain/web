import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { SharedModule } from '../shared.module';
import { IconModule } from './icon.module';
import { EtherDecimalFixedModule } from './ether-decimal-fixed.module';
import { SetupManagementComponent } from 'src/app/widgets/setup-management';

@NgModule({
  imports: [
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    IconModule,
    EtherDecimalFixedModule,
    SharedModule,
  ],
  providers: [...serviceProviders],
  declarations: [SetupManagementComponent],
  exports: [
    SetupManagementComponent,
    TranslationModule,
    IconModule,
    EtherDecimalFixedModule,
    FlexLayoutModule,
  ],
  bootstrap: [],
  entryComponents: [SetupManagementComponent],
  schemas: [],
})
export class SetupManagementDialogModule {}
