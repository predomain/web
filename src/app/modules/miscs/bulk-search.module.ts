import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { IconModule } from './icon.module';
import { CommonModule } from '@angular/common';
import { BulkSearchComponent } from 'src/app/widgets/bulk-search';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SpinnerCustomModule } from './spinner-custom.module';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  imports: [
    CommonModule,
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    SpinnerCustomModule,
    IconModule,
  ],
  providers: [...serviceProviders],
  declarations: [BulkSearchComponent],
  exports: [
    BulkSearchComponent,
    CommonModule,
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    SpinnerCustomModule,
    IconModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class BulkSearchModule {}
