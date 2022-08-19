import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NavigatorButtonsStateModel } from '../../models/states/navigator-interfaces';
import { NavigatorButtonsStateSet } from '../actions';
import { initialNavigatorButtonsState } from '../reducers';
import { getCurrentNavigatorButtonsState } from '../selectors';

@Injectable({
  providedIn: 'root',
})
export class NavigatorButtonsFacadeService {
  disabledButtonnavigatorState$: Observable<NavigatorButtonsStateModel>;

  constructor(public store: Store<NavigatorButtonsStateModel>) {
    this.disabledButtonnavigatorState$ = this.store.pipe(
      select(getCurrentNavigatorButtonsState)
    );
  }

  newNavigatorButtonsState(navigatorState: NavigatorButtonsStateModel) {
    setTimeout(() => {
      this.store.dispatch(new NavigatorButtonsStateSet(navigatorState));
    }, 100);
  }

  resetNavigatorButtonState() {
    setTimeout(() => {
      this.store.dispatch(
        new NavigatorButtonsStateSet(initialNavigatorButtonsState)
      );
    });
  }
}
