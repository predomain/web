import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChildren,
  ChangeDetectorRef,
  Input,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { loadHeavyPagesAndSlides } from '../../configurations/load-heavy-elements.conf';
import {
  NavigatorButtonsEnum,
  NavigatorButtonsStateModel,
  NavigatorStateModel,
} from '../../models/states/navigator-interfaces';
import {
  PagesEnum,
  PagesStateModel,
} from '../../models/states/pages-interfaces';
import {
  NavigatorButtonsFacadeService,
  NavigatorFacadeService,
  PagesFacadeService,
  UserFacadeService,
} from '../../store/facades';
import { NavigatorButtonComponent } from '../navigator-button';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.scss'],
})
export class NavigatorComponent implements OnInit, OnDestroy {
  @ViewChildren(NavigatorButtonComponent)
  navigatorButtons: QueryList<NavigatorButtonComponent>;
  @Input() disableButtons = false;
  navigationState: NavigatorStateModel;
  disabledButtons: NavigatorButtonsEnum[];
  hiddenButtons: NavigatorButtonsEnum[];
  pagesState: PagesStateModel;
  navigatorStateSubscription;
  disabledNavigatorButtonStateSubscription;
  pagesStateSubscription;
  navigationButtons: typeof NavigatorButtonsEnum = NavigatorButtonsEnum;
  pages: typeof PagesEnum = PagesEnum;
  constructor(
    public userFacade: UserFacadeService,
    public navigatorFacade: NavigatorFacadeService,
    public pagesFacade: PagesFacadeService,
    public navigatorButtonsFacade: NavigatorButtonsFacadeService,
    public changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.disabledNavigatorButtonStateSubscription =
      this.navigatorButtonsFacade.disabledButtonnavigatorState$
        .pipe(
          map((navigationButtonStateRaw) => {
            this.checkAndAdjustButtons(navigationButtonStateRaw);
            this.changeDetectorRef.detectChanges();
          })
        )
        .subscribe();
    this.navigatorStateSubscription = this.navigatorFacade.navigatorState$
      .pipe(
        map((navigationStateRaw) => {
          this.navigationState = navigationStateRaw;
        })
      )
      .subscribe();
    this.pagesStateSubscription = this.pagesFacade.pagesState$
      .pipe(
        map((pagesStateRaw) => {
          if (pagesStateRaw === undefined) {
            return;
          }
          this.pagesState = pagesStateRaw;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.navigatorStateSubscription) {
      this.navigatorStateSubscription.unsubscribe();
      this.navigatorStateSubscription = undefined;
    }
    if (this.disabledNavigatorButtonStateSubscription) {
      this.disabledNavigatorButtonStateSubscription.unsubscribe();
      this.disabledNavigatorButtonStateSubscription = undefined;
    }
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
      this.pagesStateSubscription = undefined;
    }
  }

  navigationButtonClicked(buttonNavigatorId: NavigatorButtonsEnum) {
    if (
      this.disabledButtons !== undefined &&
      this.disabledButtons.indexOf(buttonNavigatorId) > -1
    ) {
      return;
    }
    const loadHeavyElements = loadHeavyPagesAndSlides;
    const loadHeavyPagesIds = Object.keys(loadHeavyElements);
    const currentPage = this.pagesState.currentPageId;
    const nextPageSlide = this.pagesState.currentPageSlide + 1;
    if (
      loadHeavyPagesIds.indexOf(currentPage) > -1 &&
      loadHeavyElements[currentPage].length <= 0
    ) {
      this.pagesFacade.showLoadingProgressBar();
    } else if (
      loadHeavyPagesIds.indexOf(currentPage) > -1 &&
      loadHeavyElements[currentPage].length > 0 &&
      loadHeavyElements[currentPage].indexOf(nextPageSlide) > -1
    ) {
      this.pagesFacade.showLoadingProgressBar();
    }

    const newNavigatorState = {
      navigatorActiveButtonId: buttonNavigatorId,
      navigatorData: undefined,
      disabledButtons: undefined,
    } as NavigatorStateModel;
    this.navigatorFacade.newNavigatorState(newNavigatorState);
  }

  checkAndAdjustButtons(buttonState: NavigatorButtonsStateModel) {
    this.disabledButtons = buttonState.disabledButtons;
    this.hiddenButtons = buttonState.hideButtons;
    if (
      buttonState.disabledButtons === undefined ||
      this.navigatorButtons === undefined ||
      !this.navigatorButtons
    ) {
      return;
    }
    const modifiedButtons = [];
    const modifiedButtonTexts = [];
    if (
      'buttonTexts' in buttonState &&
      buttonState.buttonTexts !== undefined &&
      buttonState.buttonTexts.length > 0
    ) {
      buttonState.buttonTexts.forEach((b) => {
        modifiedButtons.push(b.buttonId);
        modifiedButtonTexts.push(b.buttonText);
      });
    }
    this.navigatorButtons.forEach((b) => {
      if (modifiedButtons.indexOf(b.buttonId) > -1) {
        b.buttonTextModified =
          modifiedButtonTexts[modifiedButtons.indexOf(b.buttonId)];
      } else {
        b.buttonTextModified = undefined;
      }
      if (
        buttonState.disabledButtons.indexOf(b.buttonId) > -1 ||
        this.disableButtons === true
      ) {
        b.isDisabled = true;
      } else {
        b.isDisabled = false;
      }
      if (
        'hideButtons' in buttonState &&
        buttonState.hideButtons.indexOf(b.buttonId) > -1
      ) {
        b.isHidden = true;
      } else {
        b.isHidden = false;
      }
      b.buttonChanged();
    });
    this.changeDetectorRef.detectChanges();
  }

  showButtonIfnotDisabled(buttonId: NavigatorButtonsEnum) {
    if (this.hiddenButtons === undefined) {
      return true;
    }
    if (this.hiddenButtons.indexOf(buttonId) > -1) {
      return false;
    }
    return true;
  }
}
