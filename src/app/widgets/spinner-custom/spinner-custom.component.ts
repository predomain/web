import { Component, OnInit, Input } from '@angular/core';
import {
  UserStoreErrorsEnum,
  WalletStoreErrorsEnum,
} from '../../models/error-enums';
import { SpinnerModesEnum } from '../../models/spinner';
import {
  UserStoreSuccessEnum,
  WalletStoreSuccessEnum,
} from '../../models/success-enums';
import { PagesFacadeService } from '../../store/facades';

@Component({
  selector: 'app-custom-spinner',
  templateUrl: './spinner-custom.component.html',
  styleUrls: ['./spinner-custom.component.scss'],
})
export class SpinnerCustomComponent implements OnInit {
  @Input() padded = true;
  @Input() spinnerSize = 30;
  @Input() spinnerText = 'SPINNER.LOADING';
  @Input() successText = 'SPINNER.SPINNER_SUCCESS_TEXT';
  @Input() failureText = 'SPINNER.SPINNER_FAILURE_TEXT';
  @Input() failureIcon = 'clear';
  @Input() successIcon = 'check';
  @Input() customIcon = '';
  @Input() showText = true;
  @Input() lightColour = false;
  @Input() subText;
  @Input() subTextTranslated = false;
  @Input() mode: SpinnerModesEnum = SpinnerModesEnum.LOADING;
  @Input() errorType: WalletStoreErrorsEnum | UserStoreErrorsEnum;
  @Input() successType: WalletStoreSuccessEnum | UserStoreSuccessEnum;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;

  constructor(public pagesFacade: PagesFacadeService) {}

  ngOnInit() {}

  getErrorText(error: WalletStoreErrorsEnum | UserStoreErrorsEnum) {
    switch (error) {
      case WalletStoreErrorsEnum.RECOVERY_INVALID:
        {
          return 'ERRORS.RECOVERY_INVALID';
        }
        break;

      case WalletStoreErrorsEnum.PIN_INVALID:
        {
          return 'ERRORS.PIN_INVALID';
        }
        break;

      case WalletStoreErrorsEnum.OLD_PIN_INVALID:
        {
          return 'ERRORS.OLD_PIN_INVALID';
        }
        break;

      case WalletStoreErrorsEnum.NEW_PIN_INVALID:
        {
          return 'ERRORS.NEW_PIN_INVALID';
        }
        break;

      case UserStoreErrorsEnum.EMAIL_INVALID:
        {
          return 'ERRORS.EMAIL_INVALID';
        }
        break;

      case UserStoreErrorsEnum.COMPANY_ADDRESS_INVALID:
        {
          return 'ERRORS.COMPANY_ADDRESS_INVALID';
        }
        break;

      case UserStoreErrorsEnum.COMPANY_NAME_INVALID:
        {
          return 'ERRORS.COMPANY_NAME_INVALID';
        }
        break;

      case UserStoreErrorsEnum.SELECTED_CURRENCIES_INVALID:
        {
          return 'ERRORS.SELECTED_CURRENCIES_INVALID';
        }
        break;

      case UserStoreErrorsEnum.ACCOUNT_EXISTS:
        {
          return 'ERRORS.ACCOUNT_EXISTS';
        }
        break;

      case UserStoreErrorsEnum.WALLET_ADDRESS_INVALID:
        {
          return 'ERRORS.WALLET_ADDRESS_INVALID';
        }
        break;

      case UserStoreErrorsEnum.CANNOT_FIND_WALLET_ADDRESS_TO_RECOVER:
        {
          return 'ERRORS.CANNOT_FIND_WALLET_ADDRESS_TO_RECOVER';
        }
        break;

      case UserStoreErrorsEnum.USER_NO_NETWORK_CONNECTION:
        {
          return 'ERRORS.USER_NO_NETWORK_CONNECTION';
        }
        break;

      case UserStoreErrorsEnum.DEVICE_VERIFICATION_FAILED:
        {
          return 'ERRORS.DEVICE_VERIFICATION_FAILED';
        }
        break;

      case UserStoreErrorsEnum.REGISTRATION_EXPIRED:
        {
          return 'ERRORS.REGISTRATION_EXPIRED';
        }
        break;

      case UserStoreErrorsEnum.REGISTER_CAPTCHA_INVALID:
        {
          return 'ERRORS.REGISTER_CAPTCHA_INVALID';
        }
        break;

      default:
        {
          return 'ERRORS.UNKNOWN';
        }
        break;
    }
  }

  getSuccessText(success: WalletStoreSuccessEnum | UserStoreSuccessEnum) {
    switch (success) {
      case WalletStoreSuccessEnum.WALLET_ADDED:
        {
          return 'SUCCESSES.WALLET_ADDED';
        }
        break;

      case WalletStoreSuccessEnum.WALLET_PIN_CHANGED:
        {
          return 'SUCCESSES.WALLET_PIN_CHANGED';
        }
        break;

      case UserStoreSuccessEnum.USER_ADDED:
        {
          return 'SUCCESSES.USER_ADDED';
        }
        break;
    }
  }
}
