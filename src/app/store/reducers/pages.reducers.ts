import { IpfsStatesEnum } from 'src/app/models/ipfs';
import { generalConfigurations } from '../../configurations';
import { PagesStateModel } from '../../models/states/pages-interfaces';
import {
  GetPagesState,
  GotoPageRoute,
  HideLoadingProgressBarOnLoadFinished,
  SetPageChainCode,
  SetPageIpfsErrors,
  SetPageIpfsState,
  SetPagesCriticalError,
  SetPagesNewPageState,
  SetPagesPageSlide,
  SetPagesState,
  SetPagesVisibility,
  ShowLoadingProgressBarOnLoad,
} from '../actions';

const initialPagesState: PagesStateModel = {
  pageVisibility: true,
  criticalErrorOccured: false,
  currentPageId: generalConfigurations.defaultPage,
  currentPageSlide: 0,
  errorCode: undefined,
  ipfsError: undefined,
  ipfsReady: IpfsStatesEnum.IPFS_INITIALISING,
  networkStatus: undefined,
  networkChainCode: undefined,
  isPageLoading: false,
};

export function PagesReducers(
  state: PagesStateModel = initialPagesState,
  action: any
) {
  switch (action.type) {
    case SetPagesState: {
      const newState = {
        ...state,
        currentPageId:
          'currentPageId' in action.payload
            ? action.payload.currentPageId
            : state.currentPageId,
        networkStatus:
          'networkStatus' in action.payload
            ? action.payload.networkStatus
            : state.networkStatus,
        networkChainCode:
          'networkChainCode' in action.payload
            ? action.payload.networkChainCode
            : state.networkChainCode,
        currentPageSlide: state.currentPageSlide,
        errorCode:
          'errorCode' in action.payload ? action.payload.errorCode : undefined,
      };
      return newState;
    }

    case SetPagesVisibility: {
      const newState = {
        ...state,
        pageVisibility: action.payload,
      };
      return newState;
    }

    case SetPagesCriticalError: {
      const newState = {
        ...state,
        criticalErrorOccured: action.payload,
      };
      return newState;
    }

    case SetPageIpfsErrors: {
      const newState = {
        ...state,
        ipfsError: action.payload,
        ipfsReady: IpfsStatesEnum.IPFS_FAILED,
      };
      return newState;
    }

    case SetPageIpfsState: {
      const newState = {
        ...state,
        ipfsReady: action.payload,
      };
      return newState;
    }

    case SetPagesPageSlide: {
      const newState = {
        ...state,
        currentPageSlide: action.payload,
      };
      return newState;
    }

    case SetPagesNewPageState: {
      const newState = {
        ...state,
        pageId: action.payload.currentPageId,
        currentPageSlide: state.currentPageSlide,
      };
      return newState;
    }

    case SetPagesPageSlide: {
      const newState = {
        ...state,
        currentPageSlide: action.payload,
      };
      return newState;
    }

    case SetPageChainCode: {
      const newState = {
        ...state,
        networkChainCode: action.payload,
      };
      return newState;
    }

    case ShowLoadingProgressBarOnLoad: {
      const newState = {
        ...state,
        isPageLoading: true,
      };
      return newState;
    }

    case HideLoadingProgressBarOnLoadFinished: {
      const newState = {
        ...state,
        isPageLoading: false,
      };
      return newState;
    }

    case GetPagesState: {
      return state;
    }

    case GotoPageRoute: {
      return {
        ...state,
        currentPageId: action.payload.pageId,
      };
    }

    default:
      return state;
  }
}
