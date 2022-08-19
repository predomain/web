import { Component, OnInit } from '@angular/core';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
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
  silly = [
    "You can't park there mate.",
    '.eth not found',
    "Something went wrong. Don't panic.",
  ];
  sillyPicked = Math.floor(Math.random() * this.silly.length);
  sillyCriticalErrorPicked = Math.floor(
    Math.random() * this.criticalErrorSilly.length
  );
  constructor(
    protected pagesFacade: PagesFacadeService,
    protected bookmarksService: BookmarksServiceService,
    protected registrationService: RegistrationServiceService
  ) {}

  ngOnInit(): void {}

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
