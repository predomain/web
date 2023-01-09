import { HttpClient } from '@angular/common/http';
import { FormatTimePipe, TimeAgoPipe } from '../modules/pipes';
import {
  FormValidationService,
  MiscUtilsService,
  PaymentStorageService,
  TranslationService,
  UserService,
  UserSessionService,
} from '../services';
import { BookmarksServiceService } from '../services/bookmarks';
import { EnsService } from '../services/ens';
import { WalletConnectService } from '../services/wallet-connect';
import {
  RegistrationDataService,
  RegistrationServiceService,
} from '../services/registration';
import {
  NavigatorButtonsFacadeService,
  NavigatorFacadeService,
  PagesFacadeService,
  UserFacadeService,
} from '../store/facades';
import { DownloadService } from '../services/download/download.service';
import { ContractService } from '../services/contract';
import { EnsHelperService } from '../services/ens-helper';
import { LnrService } from '../services/lnr';
import { CategoriesDataService } from '../services/categories-data';
import { PoapService } from '../services/poap';

export const serviceProviders = [
  UserService,
  UserSessionService,
  UserFacadeService,
  PagesFacadeService,
  NavigatorFacadeService,
  NavigatorButtonsFacadeService,
  FormValidationService,
  MiscUtilsService,
  TranslationService,
  FormatTimePipe,
  TimeAgoPipe,
  HttpClient,
  EnsService,
  RegistrationDataService,
  BookmarksServiceService,
  RegistrationServiceService,
  PaymentStorageService,
  WalletConnectService,
  DownloadService,
  ContractService,
  EnsHelperService,
  LnrService,
  CategoriesDataService,
  PoapService,
];
