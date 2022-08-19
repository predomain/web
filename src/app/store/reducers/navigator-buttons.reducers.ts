import { NavigatorButtonsStateModel } from "../../models/states/navigator-interfaces";
import { GetNavigatorButtonsState, SetNavigatorButtonsState } from "../actions";

export const initialNavigatorButtonsState: NavigatorButtonsStateModel = {
  disabledButtons: undefined,
};

export function NavigatorButtonsReducers(
  state: NavigatorButtonsStateModel = initialNavigatorButtonsState,
  action: any
) {
  switch (action.type) {
    case SetNavigatorButtonsState: {
      return action.payload;
    }

    case GetNavigatorButtonsState: {
      return state;
    }

    default:
      return state;
  }
}
