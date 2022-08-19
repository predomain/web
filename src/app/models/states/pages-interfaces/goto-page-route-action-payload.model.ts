import { PagesEnum } from './pages.enum';

export interface GotoPageRouteActionPayloadModel {
	route: string;
	pageId: PagesEnum;
}
