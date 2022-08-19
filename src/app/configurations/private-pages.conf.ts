import { PagesEnum } from '../models/states/pages-interfaces';

/**
 * Define pages that are not accessible without a wallet connected.
 */
export const privatePages = [PagesEnum.CANVAS, PagesEnum.CHECKOUT];
