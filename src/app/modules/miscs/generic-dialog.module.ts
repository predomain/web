import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { GenericDialogComponent } from '../../widgets/generic-dialog/generic-dialog.component';
import { IconModule } from './icon.module';
import { CommonModule } from '@angular/common';

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
  declarations: [GenericDialogComponent],
  exports: [
    CommonModule,
    GenericDialogComponent,
    TranslationModule,
    FlexLayoutModule,
    IconModule,
  ],
  bootstrap: [],
  entryComponents: [GenericDialogComponent],
  schemas: [],
})
export class GenericDialogModule {}
