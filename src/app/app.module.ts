import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  BrowserModule,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Intercept } from './services/intercept/intercept';
import { HammerJsConf } from './configurations';
import { serviceProviders } from './models';
import { NetworkStatusDialogComponent } from './widgets/network-status-dialog';
import { GenericDialogModule, TranslationModule } from './modules/miscs';
import {
  ENSBookmarkReducers,
  ENSRegistrationReducers,
  NavigatorButtonsReducers,
  NavigatorReducers,
  PagesReducers,
  PaymentReducers,
  UserReducers,
} from './store/reducers';
import {
  ENSBookmarkEffects,
  NavigatorEffects,
  PagesEffects,
  PaymentEffects,
  UserEffects,
} from './store/effects';
import { environment } from '../environments/environment';
import { ENSRegistrationEffects } from './store/effects';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [AppComponent, NetworkStatusDialogComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    FlexLayoutModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TranslationModule,
    StoreModule.forRoot(
      {
        UserState: UserReducers,
        NavigatorState: NavigatorReducers,
        PagesState: PagesReducers,
        PaymentState: PaymentReducers,
        NavigatorButtonsState: NavigatorButtonsReducers,
        ENSRegistrationState: ENSRegistrationReducers,
        ENSBookmarkState: ENSBookmarkReducers,
      },
      {
        runtimeChecks: {
          strictActionImmutability: false,
        },
      }
    ),
    EffectsModule.forRoot([
      UserEffects,
      NavigatorEffects,
      PagesEffects,
      PaymentEffects,
      ENSRegistrationEffects,
      ENSBookmarkEffects,
    ]),
    environment.deployed === true
      ? []
      : StoreDevtoolsModule.instrument({
          maxAge: 200,
        }),
    MatDialogModule,
    MatButtonModule,
    GenericDialogModule,
  ],
  exports: [
    NetworkStatusDialogComponent,
    BrowserModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    TranslationModule,
    MatSnackBarModule,
    GenericDialogModule,
  ],
  providers: [
    ...serviceProviders,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HammerJsConf,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Intercept,
      multi: true,
    },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
  ],
  bootstrap: [AppComponent],
  entryComponents: [NetworkStatusDialogComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {}
