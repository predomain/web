import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { IconModule } from './icon.module';
import { CommonModule } from '@angular/common';
import { MainHeaderComponent } from 'src/app/widgets/main-header';
import { BulkSearchModule } from './bulk-search.module';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { BlockyModule } from './blocky.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpinnerCustomModule } from './spinner-custom.module';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatInputModule,
    FlexLayoutModule,
    SpinnerCustomModule,
    BulkSearchModule,
    BlockyModule,
    IconModule,
  ],
  providers: [...serviceProviders],
  declarations: [MainHeaderComponent],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MainHeaderComponent,
    MatDialogModule,
    MatButtonModule,
    MatBadgeModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatInputModule,
    TranslationModule,
    FlexLayoutModule,
    SpinnerCustomModule,
    BulkSearchModule,
    BlockyModule,
    IconModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class MainHeaderModule {}
