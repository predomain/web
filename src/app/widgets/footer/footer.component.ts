import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { delay, delayWhen, map, retryWhen, switchMap } from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';
import { CategoryFacadeService } from 'src/app/store/facades';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
  checkFailed = false;
  pingerInitiated = false;
  startMs;
  endMs;
  categoryState: CategoriesStateModel;
  categoryStateSubscription;
  pingerSubscription;

  constructor(protected categoryFacade: CategoryFacadeService) {}

  ngOnInit(): void {
    let retries;
    this.categoryStateSubscription = this.categoryFacade.categoryState$
      .pipe(
        map((s) => {
          if (s === null || s === undefined) {
            throw false;
          }
          this.categoryState = s;
          if (
            this.categoryState.categoriesMetadata.rootDataProviders ===
              undefined ||
            'rootDataProviders' in this.categoryState.categoriesMetadata ===
              false ||
            this.categoryState.categoriesMetadata.rootDataProviders.length <= 0
          ) {
            throw false;
          }
          if (this.pingerInitiated === true) {
            return;
          }
          this.pingerInitiated = true;
          this.startMs = new Date().getTime();
          this.checkFailed = false;
          this.initPinger();
        }),
        retryWhen((error) =>
          error.pipe(
            delayWhen((e) => {
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                return of(false);
              }
              retries++;
              return timer(1000);
            })
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.categoryStateSubscription.unsubscribe();
  }

  pingDataNode() {
    return new Observable((observer) => {
      fetch(
        this.categoryState.categoriesMetadata.rootDataProviders[0] + '/ping/0x0'
      )
        .then((r) => {
          this.endMs = new Date().getTime();
          if (r === null || (r.status !== 200 && r.status !== 201)) {
            this.checkFailed = true;
            observer.next(false);
            observer.complete();
            return;
          }
          observer.next(true);
          observer.complete();
          return;
        })
        .catch((e) => {
          this.checkFailed = true;
          observer.next(false);
          observer.complete();
          return;
        });
    });
  }

  initPinger() {
    if (this.pingerSubscription) {
      this.pingerSubscription.unsubscribe();
      this.pingerSubscription = undefined;
    }
    this.pingerSubscription = this.pingDataNode().subscribe((r) => {});
  }

  get lastPingFloat() {
    return this.endMs - this.startMs;
  }

  get isDeviceMobile() {
    return document.body.clientWidth <= 1000;
  }
}
