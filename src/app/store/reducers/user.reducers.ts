import { UserModel, UserStateModel } from "../../models/states/user-interfaces";
import {
  AddUser,
  GetUserState,
  RegisterUser,
  RemoveUser,
  RemoveUserError,
  RemoveUserState,
  SetUserError,
  SetUserState,
  UpdateUser,
} from "../actions";

const initialUserState: UserStateModel = {
  error: undefined,
  loading: false,
  success: undefined,
  user: {} as UserModel,
};

export function UserReducers(
  state: UserStateModel = initialUserState,
  action: any
) {
  switch (action.type) {
    case SetUserError: {
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    }

    case SetUserState: {
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    }

    case AddUser: {
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    }

    case UpdateUser: {
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    }

    case GetUserState: {
      const newState = {
        ...state,
      };
      return newState;
    }

    case RemoveUserError: {
      return {
        ...state,
        loading: false,
        error: undefined,
      };
    }

    case RegisterUser: {
      return {
        ...state,
        loading: true,
        error: undefined,
      };
    }

    case RemoveUser: {
      return {
        ...state,
        user: {},
      };
    }

    case RemoveUserState: {
      return initialUserState;
    }

    default:
      return state;
  }
}
