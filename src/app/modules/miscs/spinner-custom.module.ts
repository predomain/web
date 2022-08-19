import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { SpinnerCustomComponent } from 'src/app/widgets/spinner-custom';
import { CommonModule } from '@angular/common';
import { IconModule } from './icon.module';

@NgModule({
  imports: [
    CommonModule,
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    IconModule,
  ],
  providers: [...serviceProviders],
  declarations: [SpinnerCustomComponent],
  exports: [
    SpinnerCustomComponent,
    CommonModule,
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    IconModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class SpinnerCustomModule {}
