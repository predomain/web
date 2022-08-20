import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { serviceProviders } from '../../models';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from 'src/app/widgets/settings';
import { SharedModule } from '../shared.module';

@NgModule({
  imports: [CommonModule, TranslationModule, SharedModule],
  providers: [...serviceProviders],
  declarations: [SettingsComponent],
  exports: [CommonModule, SettingsComponent, SharedModule],
  bootstrap: [],
  entryComponents: [SettingsComponent],
  schemas: [],
})
export class SettingsDialogModule {}
