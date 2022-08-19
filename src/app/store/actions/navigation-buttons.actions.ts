import { Action } from "@ngrx/store";
import { NavigatorButtonsStateModel } from "../../models/states/navigator-interfaces";

export const SetNavigatorButtonsState =
  "[NavigatorButtonsState] New state set.";
export const GetNavigatorButtonsState =
  "[NavigatorButtonsState] Latest state retrieved.";

export class NavigatorButtonsStateSet implements Action {
  readonly type = SetNavigatorButtonsState;
  constructor(public payload: NavigatorButtonsStateModel) {}
}

export class NavigatorButtonsStateGet implements Action {
  readonly type = GetNavigatorButtonsState;
  constructor() {}
}

export type NavigatorButtonActions =
  | NavigatorButtonsStateSet
  | NavigatorButtonsStateGet;
