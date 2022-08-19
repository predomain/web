import { createFeatureSelector, createSelector } from "@ngrx/store";
import { NavigatorButtonsStateModel } from "../../models/states/navigator-interfaces";

export const getNavigatorButtonsState =
  createFeatureSelector<NavigatorButtonsStateModel>("NavigatorButtonsState");

export const getCurrentNavigatorButtonsState = createSelector(
  getNavigatorButtonsState,
  (state: NavigatorButtonsStateModel) => state
);
