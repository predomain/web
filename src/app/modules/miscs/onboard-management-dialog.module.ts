import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { SharedModule } from '../shared.module';
import { OnboardManagementComponent } from 'src/app/widgets/onboard-management';
import { IconModule } from './icon.module';

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
  declarations: [OnboardManagementComponent],
  exports: [
    OnboardManagementComponent,
    TranslationModule,
    IconModule,
    FlexLayoutModule,
  ],
  bootstrap: [],
  entryComponents: [OnboardManagementComponent],
  schemas: [],
})
export class OnboardManagementDialogModule {}
