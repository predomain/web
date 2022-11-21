import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import {
  PageModesEnum,
  PagesEnum,
} from 'src/app/models/states/pages-interfaces';
import { UserSessionService } from 'src/app/services';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { RegistrationServiceService } from 'src/app/services/registration';
import { PagesFacadeService } from 'src/app/store/facades';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent implements OnInit {
  starCount = new Array(10).fill(0);
  criticalErrorSilly = [
    'An error has occured while processing your request. Please try again.',
  ];
  silly = ['.eth not found'];
  sillyPicked = Math.floor(Math.random() * this.silly.length);
  sillyCriticalErrorPicked = Math.floor(
    Math.random() * this.criticalErrorSilly.length
  );
  pagesStateSubscription;

  constructor(
    protected pagesFacade: PagesFacadeService,
    protected bookmarksService: BookmarksServiceService,
    protected userSessionService: UserSessionService,
    protected registrationService: RegistrationServiceService
  ) {}

  ngOnInit(): void {
    this.pagesStateSubscription = this.pagesFacade.pageMode$
      .pipe(
        map((s) => {
          if (s === PageModesEnum.PROFILE) {
            this.pagesFacade.gotoPageRoute(
              'profile/' +
                this.userSessionService.getUserIdFromDomain() +
                '.eth',
              PagesEnum.PROFILE
            );
          }
        })
      )
      .subscribe();
  }

  goToHome() {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  countBookmarks() {
    return this.bookmarksService.countBookmarks();
  }

  countRegistrations() {
    return this.registrationService.countRegistrations();
  }

  get hasCriticalErrorOccured() {
    return this.pagesFacade.pageCritiaclError$;
  }

  get sillyCriticalDescription() {
    return this.criticalErrorSilly[this.sillyCriticalErrorPicked];
  }

  get sillyDescription() {
    return this.silly[this.sillyPicked];
  }

  get registrationCount() {
    return this.countRegistrations();
  }

  get bookmarksCount() {
    return this.countBookmarks();
  }
}
