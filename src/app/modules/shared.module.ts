import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatProgressBarModule,
  MAT_PROGRESS_BAR_DEFAULT_OPTIONS,
} from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationModule } from './miscs/translation.module';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  GenericDialogModule,
  CustomAddressDialogModule,
  IconModule,
} from './miscs';
import { serviceProviders } from '../models';
import { HammerJsConf } from '../configurations';
import { GetScrollableXyDirective } from './directives';
import { FormatTimePipe, TimeAgoPipe } from './pipes';
import { HeaderComponent } from '../widgets/header';
import { NavigatorComponent } from '../widgets/navigator';
import { NavigatorButtonComponent } from '../widgets/navigator-button';
import { PinInputComponent } from '../widgets/pin-input';
import { SpinnerComponent } from '../widgets/spinner';
import { PreviewImageComponent } from '../widgets/preview-image';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { QRCodeModule } from 'angularx-qrcode';
import { NgxColorsModule } from 'ngx-colors';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';

@NgModule({
  imports: [
    HttpClientModule,
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    IconModule,
    MatBottomSheetModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatButtonModule,
    MatChipsModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatRadioModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatBadgeModule,
    TranslationModule,
    DragDropModule,
    OverlayModule,
    GenericDialogModule,
    CustomAddressDialogModule,
    QRCodeModule,
    NgxColorsModule,
  ],
  providers: [
    ...serviceProviders,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HammerJsConf,
    },
    { provide: MAT_PROGRESS_BAR_DEFAULT_OPTIONS, useValue: {} },
    { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
  ],
  declarations: [
    HeaderComponent,
    NavigatorComponent,
    NavigatorButtonComponent,
    PinInputComponent,
    SpinnerComponent,
    GetScrollableXyDirective,
    FormatTimePipe,
    TimeAgoPipe,
    PreviewImageComponent,
  ],
  exports: [
    HttpClientModule,
    TranslationModule,
    CommonModule,
    RouterModule,
    HeaderComponent,
    NavigatorComponent,
    NavigatorButtonComponent,
    MatAutocompleteModule,
    PinInputComponent,
    SpinnerComponent,
    PreviewImageComponent,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    IconModule,
    MatBottomSheetModule,
    MatExpansionModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSliderModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatListModule,
    MatStepperModule,
    MatTooltipModule,
    MatMenuModule,
    MatTableModule,
    MatSnackBarModule,
    MatBadgeModule,
    DragDropModule,
    OverlayModule,
    GetScrollableXyDirective,
    FormatTimePipe,
    TimeAgoPipe,
    GenericDialogModule,
    CustomAddressDialogModule,
    QRCodeModule,
    NgxColorsModule,
  ],
  bootstrap: [],
  entryComponents: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {}
