import { NgModule } from '@angular/core';
import { TranslationModule } from './translation.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { serviceProviders } from '../../models';
import { IconModule } from './icon.module';
import { FooterComponent } from 'src/app/widgets/footer';
import { SharedModule } from '../shared.module';
import { EtherDecimalFixedModule } from './ether-decimal-fixed.module';

@NgModule({
  imports: [
    TranslationModule,
    FlexLayoutModule,
    IconModule,
    EtherDecimalFixedModule,
    SharedModule,
  ],
  providers: [...serviceProviders],
  declarations: [FooterComponent],
  exports: [
    TranslationModule,
    FlexLayoutModule,
    IconModule,
    EtherDecimalFixedModule,
    SharedModule,
    FooterComponent,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [],
})
export class FooterModule {}
