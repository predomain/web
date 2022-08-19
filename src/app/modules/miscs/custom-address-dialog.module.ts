import { NgModule } from "@angular/core";
import { TranslationModule } from "./translation.module";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { FlexLayoutModule } from "@angular/flex-layout";
import { serviceProviders } from "../../models";
import { CustomAddressComponent } from "../../widgets/custom-address/custom-address.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [
    TranslationModule,
    MatDialogModule,
    MatButtonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [...serviceProviders],
  declarations: [CustomAddressComponent],
  exports: [
    CustomAddressComponent,
    TranslationModule,
    FlexLayoutModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  bootstrap: [],
  entryComponents: [CustomAddressComponent],
  schemas: [],
})
export class CustomAddressDialogModule {}
