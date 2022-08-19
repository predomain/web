import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { IconComponent } from 'src/app/widgets/icon';

@NgModule({
  imports: [
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
  providers: [...serviceProviders],
  declarations: [IconComponent],
  exports: [
    IconComponent,
    MatDialogModule,
    MatButtonModule,
    TranslationModule,
    FlexLayoutModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class IconModule {}
