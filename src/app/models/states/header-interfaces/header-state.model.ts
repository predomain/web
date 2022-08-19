import { HeaderBackgroundColorsEnum } from './header-background-colors.enum';
import { PagesEnum } from '../pages-interfaces/pages.enum';

export interface HeaderStateModel {
	isLarge: boolean;
	isHidden: boolean;
	headerText: string;
	headerBackgroundColor: HeaderBackgroundColorsEnum;
	showBackButton: boolean;
	showSettingsButton: boolean;
	backButtonPageRoute: PagesEnum;
}
