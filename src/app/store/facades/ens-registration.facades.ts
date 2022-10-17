import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DomainMetadataModel } from 'src/app/models/domains';
import { ENSRegistrationStateModel } from 'src/app/models/states/ens-registration-interfaces';
import {
  ENSRegistrationAddOne,
  ENSRegistrationEffectsInit,
  ENSRegistrationErrorSet,
  ENSRegistrationRemoveAll,
  ENSRegistrationRemoveMany,
  ENSRegistrationRemoveOne,
  ENSRegistrationUpdate,
  ENSRegistrationUpsertMany,
  ENSRegistrationUpsertOne,
} from '../actions';
import {
  getENSRegistrations,
  getENSRegistrationState,
  selectENSRegistration,
} from '../selectors';

@Injectable({
  providedIn: 'root',
})
export class ENSRegistrationFacadeService {
  getENSRegistrationState$: Observable<ENSRegistrationStateModel>;

  constructor(public store: Store<ENSRegistrationStateModel>) {
    this.getENSRegistrationState$ = this.store.pipe(
      select(getENSRegistrationState)
    );
  }

  startEffects() {
    this.store.dispatch(new ENSRegistrationEffectsInit());
  }

  addRegistration(registration: DomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationAddOne(registration));
  }

  removeRegistration(registration: DomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationRemoveOne(registration.id));
  }

  removeRegistrations(registration: DomainMetadataModel[]) {
    this.store.dispatch(
      new ENSRegistrationRemoveMany(registration.map((n) => n.id))
    );
  }

  removeAllRegistrations() {
    this.store.dispatch(new ENSRegistrationRemoveAll());
  }

  upsertRegistration(registration: DomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationUpsertOne(registration));
  }

  upsertAllRegistration(registrations: DomainMetadataModel[]) {
    this.store.dispatch(new ENSRegistrationUpsertMany(registrations));
  }

  updateRegistration(registration: DomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationUpdate(registration));
  }

  getRegistration(registrationId: number) {
    return this.store.pipe(select(selectENSRegistration(registrationId)));
  }

  getRegistrations() {
    return this.store.pipe(select(getENSRegistrations));
  }

  removeRegistrationStateError() {
    this.store.dispatch(new ENSRegistrationErrorSet(undefined));
  }
}
