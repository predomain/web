import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { getCurrentUserState, getCurrentUser } from '../selectors';
import {
  UserStateSet,
  UserStateRemove,
  UserAdd,
  UserErrorRemove,
  UserErrorSet,
  UserUpdate,
  UserRemove,
  UserRegister,
} from '../actions';
import {
  UserModel,
  UserRegistrationModel,
  UserStateModel,
} from '../../models/states/user-interfaces';
import { UserStoreErrorsEnum } from '../../models/error-enums';

@Injectable({
  providedIn: 'root',
})
export class UserFacadeService {
  userState$: Observable<UserStateModel>;
  user$: Observable<UserModel>;

  constructor(public store: Store<UserStateModel>) {
    this.userState$ = this.store.pipe(select(getCurrentUserState));
    this.user$ = this.store.pipe(select(getCurrentUser));
  }

  registerUser(userData: UserRegistrationModel) {
    this.store.dispatch(new UserRegister(userData));
  }

  newUserState(userState: UserModel) {
    this.store.dispatch(new UserStateSet(userState));
  }

  removeUserState() {
    this.store.dispatch(new UserStateRemove());
  }

  removeUser() {
    this.store.dispatch(new UserRemove());
  }

  removeUserStateError() {
    this.store.dispatch(new UserErrorRemove());
  }

  setErrorState(error: UserStoreErrorsEnum) {
    this.store.dispatch(new UserErrorSet(error));
  }

  addUser(userAddData: UserModel) {
    this.store.dispatch(new UserAdd(userAddData));
  }

  updateUser(userData: UserModel) {
    this.store.dispatch(new UserUpdate(userData));
  }
}
