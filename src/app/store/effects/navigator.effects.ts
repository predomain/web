import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NavigatorStateModel } from '../../models/states/navigator-interfaces';

@Injectable()
export class NavigatorEffects {
  constructor(
    private actions$: Actions,
    public store: Store<NavigatorStateModel>
  ) {}
}
