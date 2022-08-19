import { MatDialogRef } from '@angular/material/dialog';
import { Action } from '@ngrx/store';
import { IpfsErrorsEnum } from 'src/app/models/error-enums';
import { IpfsStatesEnum } from 'src/app/models/ipfs';
import {
  GotoPageRouteActionPayloadModel,
  PagesStateModel,
} from '../../models/states/pages-interfaces';

export const ShowLoadingProgressBarOnLoad = '[PagesState] Spinner dialog set.';
export const HideLoadingProgressBarOnLoadFinished =
  '[PagesState] Spinner dialog unset.';
export const SetPagesCriticalError = '[PagesState] critical error set.';
export const SetPagesPageSlide = '[PagesState] New page slide set.';
export const SetPagesState = '[PagesState] New state set.';
export const SetPageIpfsErrors = '[PagesState] ipfs error state set.';
export const SetPageIpfsState = '[PagesState] ipfs state set.';
export const SetPageChainCode = '[PagesState] chain code set.';
export const SetPagesNewPageState = '[PagesState] New state set.';
export const SetPagesNetworkState = '[PagesState] New network state set.';
export const SetPagesVisibility = '[PagesState] visibility state set.';
export const SetPagesNetworkStateOffline =
  '[PagesState] Offline network state procedure invoke.';
export const GetPagesState = '[PagesState] Latest state retrieved.';
export const GotoPageRoute = '[PagesState] Going to page route.';

export class PagesSetVisibility implements Action {
  readonly type = SetPagesVisibility;
  constructor(public payload: boolean) {}
}

export class PagesSetCriticalError implements Action {
  readonly type = SetPagesCriticalError;
  constructor(public payload: boolean, public redirect = true) {}
}

export class PagesSetIpfsError implements Action {
  readonly type = SetPageIpfsErrors;
  constructor(public payload: IpfsErrorsEnum) {}
}

export class PagesSetIpfsState implements Action {
  readonly type = SetPageIpfsState;
  constructor(public payload: IpfsStatesEnum) {}
}

export class PagesShowLoadingProgressBarOnLoad implements Action {
  readonly type = ShowLoadingProgressBarOnLoad;
  constructor() {}
}

export class PagesHideLoadingProgressBarOnLoadFinished implements Action {
  readonly type = HideLoadingProgressBarOnLoadFinished;
  constructor() {}
}

export class PagesSetChainCode implements Action {
  readonly type = SetPageChainCode;
  constructor(public payload: number, public firstTimeSet = false) {}
}

export class PagesSetPageSlide implements Action {
  readonly type = SetPagesPageSlide;
  constructor(public payload: number) {}
}

export class PagesStateSet implements Action {
  readonly type = SetPagesState;
  constructor(public payload: PagesStateModel) {}
}

export class PagesNewPageStateSet implements Action {
  readonly type = SetPagesNewPageState;
  constructor(public payload: PagesStateModel) {}
}

export class PagesNetworkStateSet implements Action {
  readonly type = SetPagesNetworkState;
  constructor(public payload: PagesStateModel) {}
}

export class PagesNetworkOfflineStateInvoke implements Action {
  readonly type = SetPagesNetworkStateOffline;
  constructor() {}
}

export class PagesStateGet implements Action {
  readonly type = GetPagesState;
  constructor() {}
}

export class PageGotoRoute implements Action {
  readonly type = GotoPageRoute;
  constructor(public payload: GotoPageRouteActionPayloadModel) {}
}

export type PagesActions =
  | PagesSetChainCode
  | PagesSetIpfsError
  | PagesSetIpfsState
  | PagesSetPageSlide
  | PagesHideLoadingProgressBarOnLoadFinished
  | PagesShowLoadingProgressBarOnLoad
  | PagesStateSet
  | PagesStateGet
  | PagesNewPageStateSet
  | PagesNetworkOfflineStateInvoke
  | PageGotoRoute
  | PagesNetworkStateSet
  | PagesSetCriticalError;
