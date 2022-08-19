import { NavigatorButtonsEnum } from '../models/states/navigator-interfaces/navigator-buttons.enum';
/**
 * This list of load heavy pages are used on pages.facade - when loading these pages a spinner dialog is shown to indicate loading
 */
export const loadHeavyPagesAndSlides = {} as { page: number[] };
export const buttonsToInitiateLoadingSpinner = [
  NavigatorButtonsEnum.APPROVE,
  NavigatorButtonsEnum.BACK,
  NavigatorButtonsEnum.NEXT,
  NavigatorButtonsEnum.DECLINE,
];
