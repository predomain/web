import { NavigatorButtonsEnum } from "./navigator-buttons.enum";
import { NavigatorButtonTextModel } from "./navigator-button-text.model";

export interface NavigatorButtonsStateModel {
  disabledButtons: NavigatorButtonsEnum[];
  hideButtons?: NavigatorButtonsEnum[];
  buttonTexts?: NavigatorButtonTextModel[];
}
