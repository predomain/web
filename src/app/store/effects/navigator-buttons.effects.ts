import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NavigatorButtonsStateModel } from '../../models/states/navigator-interfaces';

@Injectable()
export class NavigatorButtonsEffects {
  constructor(
    private actions$: Actions,
    public store: Store<NavigatorButtonsStateModel>
  ) {}
}
