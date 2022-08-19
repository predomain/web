import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
  MatBottomSheetConfig,
  MatBottomSheet,
} from '@angular/material/bottom-sheet';
import { HeaderBackgroundColorsEnum } from '../../models/states/header-interfaces';
import { PagesEnum } from '../../models/states/pages-interfaces';
import { PagesFacadeService } from '../../store/facades';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Output() cancelClick = new EventEmitter<boolean>();
  @Output() proceedClick = new EventEmitter<boolean>();
  @Output() backClick = new EventEmitter<boolean>();
  @Output() sandwichMenuClick = new EventEmitter<boolean>();
  @Output() settingsClick = new EventEmitter<boolean>();
  @Input() isSimple = false;
  @Input() isTextBold = false;
  @Input() isTextTiny = false;
  @Input() isHidden = false;
  @Input() veryLargeText = false;
  @Input() headerText = 'HEADER.YOUR_WALLET';
  @Input() pullLeft = false;
  @Input() pullRight = false;
  @Input() translateHeader = true;
  @Input() headerBackgroundColor: HeaderBackgroundColorsEnum =
    HeaderBackgroundColorsEnum.PRIMARY;
  @Input() showLogo = false;
  @Input() showBackButton = false;
  @Input() showSettingsButton = true;
  @Input() showCancelButton = false;
  @Input() showProceedButton = false;
  @Input() showSandwichMenu = false;
  @Input() backButtonIcon = 'arrow_back';
  @Input() blockyData = '';
  @Input() enableDropShadow = true;
  @Input() backButtonIsCloseButton = false;
  @Input() backButtonPageRoute: PagesEnum;
  headerBackgroundColors: typeof HeaderBackgroundColorsEnum =
    HeaderBackgroundColorsEnum;
  @Input() cancelText;
  @Input() proceedText;

  constructor(
    public bottomSheet: MatBottomSheet,
    public pagesFacade: PagesFacadeService
  ) {}

  ngOnInit() {}

  get getStyle() {
    if (this.headerBackgroundColor === HeaderBackgroundColorsEnum.PRIMARY) {
      if (this.enableDropShadow) {
        return {
          'co-header-primary': true,
          'co-header-shadow': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }
      return {
        'co-header-primary': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    } else if (
      this.headerBackgroundColor === HeaderBackgroundColorsEnum.TRANSLUCENT_DARK
    ) {
      if (this.enableDropShadow) {
        return {
          'translucent-dark': true,
          'co-header-shadow': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }
      return {
        'translucent-dark': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    } else if (
      this.headerBackgroundColor === HeaderBackgroundColorsEnum.PLACEHOLDER_DARK
    ) {
      if (this.enableDropShadow) {
        return {
          'placeholder-dark': true,
          'co-header-shadow-light': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }

      return {
        'placeholder-dark': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    } else if (
      this.headerBackgroundColor ===
      HeaderBackgroundColorsEnum.PLACEHOLDER_LIGHT
    ) {
      if (this.enableDropShadow) {
        return {
          'co-header-white': true,
          'co-header-shadow-border': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }

      return {
        'co-header-white': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    } else if (
      this.headerBackgroundColor ===
      HeaderBackgroundColorsEnum.TRANSLUCENT_LIGHT
    ) {
      if (this.enableDropShadow) {
        return {
          'translucent-light': true,
          'co-header-shadow': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }

      return {
        'translucent-light': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    } else if (this.headerBackgroundColor === HeaderBackgroundColorsEnum.GRAY) {
      if (this.enableDropShadow) {
        return {
          'co-header-gray': true,
          'co-header-shadow-border': true,
          'co-header-very-large': this.veryLargeText === true,
        };
      }

      return {
        'co-header-gray': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    }

    if (this.enableDropShadow) {
      return {
        'co-header-white': true,
        'co-header-shadow-light': true,
        'co-header-very-large': this.veryLargeText === true,
      };
    }

    return {
      'co-header-white': true,
      'co-header-very-large': this.veryLargeText === true,
    };
  }

  getTextAlignment() {
    if (this.pullLeft === true) {
      return 'start center';
    }

    if (this.pullRight === true) {
      return 'end center';
    }

    return 'center center';
  }

  openUserMenu() {}
  showAddButton() {}
}
