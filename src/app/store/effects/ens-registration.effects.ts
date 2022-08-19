import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType,
  ROOT_EFFECTS_INIT,
} from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { ENSRegistrationStateModel } from 'src/app/models/states/ens-registration-interfaces';
import {
  RegistrationFacilityService,
  RegistrationServiceService,
} from 'src/app/services/registration';
import {
  AddOneENSRegistration,
  ENSRegistrationAddOne,
  ENSRegistrationRemoveAll,
  ENSRegistrationUpsertOne,
  RemoveAllENSRegistration,
  RemoveOneENSRegistration,
  UpsertOneENSRegistration,
} from '../actions';
import { getENSRegistrations } from '../selectors';

@Injectable()
export class ENSRegistrationEffects {
  constructor(
    private actions$: Actions,
    protected registrationService: RegistrationServiceService,
    protected registrationFacilityService: RegistrationFacilityService,
    public store: Store<ENSRegistrationStateModel>
  ) {}

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        map((p) => {
          const registrations =
            this.registrationService.loadRegistrationsAndFeed();
          for (const b of Object.keys(registrations)) {
            this.store.dispatch(
              new ENSRegistrationAddOne(
                {
                  id: registrations[b].labelName,
                  ...registrations[b],
                },
                false
              )
            );
          }
        })
      ),
    {
      dispatch: false,
    }
  );

  addOneRegistration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSRegistrationAddOne>(AddOneENSRegistration),
        filter((action) => action.toSave === true),
        map((action) => {
          this.registrationService.saveRegistrations(action.payload);
        })
      ),

    { dispatch: false }
  );

  removeOneRegistration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSRegistrationAddOne>(RemoveOneENSRegistration),
        filter((action) => action.toSave === true),
        withLatestFrom(this.store.pipe(select(getENSRegistrations))),
        map((state) => {
          const [action, registrations] = state;
          this.registrationService.removeRegistration(
            registrations,
            action.payload.labelName
          );
        })
      ),

    { dispatch: false }
  );

  removeAllRegistration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSRegistrationRemoveAll>(RemoveAllENSRegistration),
        map(() => {
          this.registrationService.removeAllRegistrations();
        })
      ),

    { dispatch: false }
  );

  upsertOneRegistration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSRegistrationUpsertOne>(UpsertOneENSRegistration),
        filter((action) => action.toSave === true),
        map((action) => {
          this.registrationService.saveRegistrations(action.payload);
        })
      ),

    { dispatch: false }
  );
}
