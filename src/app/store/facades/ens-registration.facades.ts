import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSRegistrationStateModel } from 'src/app/models/states/ens-registration-interfaces';
import {
  ENSRegistrationAddOne,
  ENSRegistrationErrorSet,
  ENSRegistrationRemoveAll,
  ENSRegistrationRemoveMany,
  ENSRegistrationRemoveOne,
  ENSRegistrationUpdate,
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

  addRegistration(registration: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationAddOne(registration));
  }

  removeRegistration(registration: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationRemoveOne(registration.id));
  }

  removeRegistrations(registration: ENSDomainMetadataModel[]) {
    this.store.dispatch(
      new ENSRegistrationRemoveMany(registration.map((n) => n.id))
    );
  }

  removeAllRegistrations() {
    this.store.dispatch(new ENSRegistrationRemoveAll());
  }

  upsertRegistration(registration: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSRegistrationUpsertOne(registration));
  }

  updateRegistration(registration: ENSDomainMetadataModel) {
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
