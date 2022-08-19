import { HeaderBackgroundColorsEnum } from "./header-background-colors.enum";
import { HeaderStateModel } from "./header-state.model";

export const DefaultHeaderState = {
  isLarge: false,
  isHidden: false,
  headerText: "HEADER.YOUR_WALLET",
  headerBackgroundColor: HeaderBackgroundColorsEnum.PRIMARY,
  showBackButton: false,
  showSettingsButton: true,
  backButtonPageRoute: undefined,
} as HeaderStateModel;
