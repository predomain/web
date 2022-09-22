import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslationModule } from '../translation.module';
import { serviceProviders } from 'src/app/models';
import { BarComponent } from 'src/app/widgets/charts/bar/bar.component';

@NgModule({
  imports: [
    CommonModule,
    TranslationModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
  providers: [...serviceProviders],
  declarations: [BarComponent],
  exports: [
    CommonModule,
    BarComponent,
    MatIconModule,
    TranslationModule,
    FlexLayoutModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class BarModule {}
