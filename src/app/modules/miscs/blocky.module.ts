import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { IconModule } from './icon.module';
import { CommonModule } from '@angular/common';
import { BlockyComponent } from 'src/app/widgets/blocky';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    TranslationModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    IconModule,
  ],
  providers: [...serviceProviders],
  declarations: [BlockyComponent],
  exports: [
    CommonModule,
    BlockyComponent,
    MatIconModule,
    TranslationModule,
    FlexLayoutModule,
    IconModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class BlockyModule {}
