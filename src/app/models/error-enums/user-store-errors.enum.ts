export enum UserStoreErrorsEnum {
  UNKNOWN = 'UNKNOWN_USER',
  CONNECT_ERROR = 'CONNECT_ERROR',
  LEDGER_NO_DEVICE_SELECTED = 'LEDGER_NO_DEVICE_SELECTED',
  EMAIL_INVALID = 'EMAIL_INVALID',
  COMPANY_NAME_INVALID = 'COMPANY_NAME_INVALID',
  COMPANY_ADDRESS_INVALID = 'COMPANY_ADDRESS_INVALID',
  SELECTED_CURRENCIES_INVALID = 'SELECTED_CURRENCIES_INVALID',
  WALLET_ADDRESS_INVALID = 'WALLET_ADDRESS_INVALID',
  ACCOUNT_EXISTS = 'ACCOUNT_EXISTS',
  USER_NO_NETWORK_CONNECTION = 'USER_NO_NETWORK_CONNECTION',
  CANNOT_FIND_WALLET_ADDRESS_TO_RECOVER = 'CANNOT_FIND_WALLET_ADDRESS_TO_RECOVER',
  DEVICE_VERIFICATION_FAILED = 'DEVICE_VERIFICATION_FAILED',
  REGISTRATION_EXPIRED = 'REGISTRATION_EXPIRED',
  REGISTER_CAPTCHA_INVALID = 'REGISTER_CAPTCHA_INVALID',
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED',
}
