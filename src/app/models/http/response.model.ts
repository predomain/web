import { ResponseCodesEnum } from './response-codes.enum';
import { ResponseTypesEnum } from './response-types.enum';

export interface ResponseModel {
  type: ResponseTypesEnum;
  code: ResponseCodesEnum;
  result: any;
}
