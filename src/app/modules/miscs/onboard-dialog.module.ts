import { NgModule } from "@angular/core";
import { TranslationModule } from "./translation.module";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { FlexLayoutModule } from "@angular/flex-layout";
import { serviceProviders } from "../../models";
import { OnboardDialogComponent } from "../../widgets/onboard-dialog";
import { SharedModule } from "../shared.module";

@NgModule({
  imports: [
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    SharedModule,
  ],
  providers: [...serviceProviders],
  declarations: [OnboardDialogComponent],
  exports: [OnboardDialogComponent, TranslationModule, FlexLayoutModule],
  bootstrap: [],
  entryComponents: [OnboardDialogComponent],
  schemas: [],
})
export class OnboardDialogModule {}
