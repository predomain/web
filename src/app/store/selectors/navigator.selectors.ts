import { createFeatureSelector, createSelector } from "@ngrx/store";
import { NavigatorStateModel } from "../../models/states/navigator-interfaces";

export const getNavigatorState =
  createFeatureSelector<NavigatorStateModel>("NavigatorState");

export const getCurrentNavigatorState = createSelector(
  getNavigatorState,
  (state: NavigatorStateModel) => state
);
