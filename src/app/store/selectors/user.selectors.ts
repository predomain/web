import { createFeatureSelector, createSelector } from "@ngrx/store";
import { UserStateModel } from "../../models/states/user-interfaces";

export const getUserState = createFeatureSelector<UserStateModel>("UserState");
export const getUser = createSelector(getUserState, (state) => state);
export const getCurrentUserState = createSelector(
  getUserState,
  (state: UserStateModel) => state
);
export const getCurrentUser = createSelector(
  getUser,
  (state: UserStateModel) => state.user
);
