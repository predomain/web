import { NavigatorStateModel } from "../../models/states/navigator-interfaces";
import { GetNavigatorState, SetNavigatorState } from "../actions";

export const initialNavigatorState: NavigatorStateModel = {
  navigatorActiveButtonId: undefined,
  navigatorData: undefined,
};

export function NavigatorReducers(
  state: NavigatorStateModel = initialNavigatorState,
  action: any
) {
  switch (action.type) {
    case SetNavigatorState: {
      return action.payload;
    }

    case GetNavigatorState: {
      return state;
    }

    default:
      return state;
  }
}
