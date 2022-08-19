import { Action } from "@ngrx/store";
import { NavigatorStateModel } from "../../models/states/navigator-interfaces";

export const SetNavigatorState = "[NavigatorState] New state set.";
export const SetNavigatorStateDisabledButtons =
  "[NavigatorState] Disabled buttons set.";
export const GetNavigatorState = "[NavigatorState] Latest state retrieved.";

export class NavigatorStateSet implements Action {
  readonly type = SetNavigatorState;
  constructor(public payload: NavigatorStateModel) {}
}

export class NavigatorStateGet implements Action {
  readonly type = GetNavigatorState;
  constructor() {}
}

export type NavigatorActions = NavigatorStateSet | NavigatorStateGet;
