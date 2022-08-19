import { UserStoreErrorsEnum } from "../../error-enums";
import { UserStoreSuccessEnum } from "../../success-enums";
import { UserModel } from "./user.model";

export interface UserStateModel {
  user: UserModel;
  loading: boolean;
  error: UserStoreErrorsEnum;
  success: UserStoreSuccessEnum;
}
