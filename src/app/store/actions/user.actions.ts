import { Action } from '@ngrx/store';
import { UserStoreErrorsEnum } from '../../models/error-enums';
import {
  UserModel,
  UserRegistrationModel,
} from '../../models/states/user-interfaces';

export const InitEffectsUserState = '[UserState] Init effects users.';
export const SetUserPoaps = '[UserState] New poaps state set.';
export const SetUserState = '[UserState] New state set.';
export const SetUserError = '[UserState] An error has occured.';
export const GetUserState = '[UserState] Latest state retrieved.';
export const RemoveUserError = '[UserState] Error removed.';
export const RemoveUserState =
  '[UserState] Latest state replaced (with Empty).';
export const RemoveUser = '[UserState] Latest user replaced (with Empty).';
export const AddUser = '[UserState] New user added.';
export const UpdateUser = '[UserState] User updated added.';
export const RegisterUser = '[UserState] New user registration.';

export class UserEffectsInit implements Action {
  readonly type = InitEffectsUserState;
  constructor() {}
}

export class UserErrorSet implements Action {
  readonly type = SetUserError;
  constructor(public payload: UserStoreErrorsEnum) {}
}

export class UserPoapsSet implements Action {
  readonly type = SetUserPoaps;
  constructor(public payload: { poapsResolved: boolean; poaps: string[] }) {}
}

export class UserUpdate implements Action {
  readonly type = UpdateUser;
  constructor(public payload: UserModel) {}
}

export class UserStateSet implements Action {
  readonly type = SetUserState;
  constructor(public payload: UserModel) {}
}

export class UserStateGet implements Action {
  readonly type = GetUserState;
  constructor(public payload: number) {}
}

export class UserStateRemove implements Action {
  readonly type = RemoveUserState;
  constructor() {}
}

export class UserErrorRemove implements Action {
  readonly type = RemoveUserError;
  constructor() {}
}

export class UserRemove implements Action {
  readonly type = RemoveUser;
  constructor() {}
}

export class UserRegister implements Action {
  readonly type = RegisterUser;
  constructor(public payload: UserRegistrationModel) {}
}

export class UserAdd implements Action {
  readonly type = AddUser;
  constructor(public payload: UserModel) {}
}

export type UserActions =
  | UserPoapsSet
  | UserEffectsInit
  | UserStateSet
  | UserUpdate
  | UserErrorSet
  | UserStateGet
  | UserStateRemove
  | UserErrorRemove
  | UserRemove
  | UserRegister
  | UserAdd;
