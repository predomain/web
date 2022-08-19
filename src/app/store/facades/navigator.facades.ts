import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NavigatorStateModel } from '../../models/states/navigator-interfaces';
import { NavigatorStateSet } from '../actions';
import { initialNavigatorState } from '../reducers';
import { getCurrentNavigatorState } from '../selectors';

@Injectable({
  providedIn: 'root',
})
export class NavigatorFacadeService {
  navigatorState$: Observable<NavigatorStateModel>;

  constructor(public store: Store<NavigatorStateModel>) {
    this.navigatorState$ = this.store.pipe(select(getCurrentNavigatorState));
  }

  newNavigatorState(navigatorState: NavigatorStateModel) {
    setTimeout(() => {
      this.store.dispatch(new NavigatorStateSet(navigatorState));
    });
  }

  resetNavigatorState() {
    setTimeout(() => {
      this.store.dispatch(new NavigatorStateSet(initialNavigatorState));
    });
  }
}
