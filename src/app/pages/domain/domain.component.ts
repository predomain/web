import { from, interval, of, Subject, timer } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  delayWhen,
  filter,
  map,
  retryWhen,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { UserService } from 'src/app/services';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { EnsService } from 'src/app/services/ens';
import {
  RegistrationDataService,
  RegistrationServiceService,
} from 'src/app/services/registration';
import {
  ENSBookmarkFacadeService,
  PagesFacadeService,
} from 'src/app/store/facades';
import { environment } from 'src/environments/environment';
import { ethers } from 'ethers';
import { CanvasServicesService } from '../canvas/canvas-services/canvas-services.service';
import { TimeAgoPipe } from 'src/app/modules/pipes';
import {
  EnsEvensSymbolEnum,
  ENSEventModel,
  EnsEventsEnum,
} from 'src/app/models/ens';
import {
  BlockExplorersEnum,
  ENSContracts,
  generalConfigurations,
} from 'src/app/configurations';
import { payNoMarketAddress } from 'src/app/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { select, Store } from '@ngrx/store';
import { getENSBookmarks } from 'src/app/store/selectors';

const globalAny: any = global;

export enum EventTypes {
  SALE = 'DOMAIN_EVENT.SALE',
  TRANSFER = 'DOMAIN_EVENT.TRANSFER',
  REGISTRATION = 'DOMAIN_EVENT.REGISTRATION',
  RENEWAL = 'DOMAIN_EVENT.RENEWAL',
}

@Component({
  selector: 'app-domain',
  templateUrl: './domain.component.html',
  styleUrls: ['./domain.component.scss'],
})
export class DomainComponent implements OnInit, OnDestroy {
  starCount = new Array(10).fill(0);
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  resolvedEvents: ENSEventModel[] = [];
  bookmarks: ENSDomainMetadataModel[];
  eventTypeIcons: typeof EnsEvensSymbolEnum = EnsEvensSymbolEnum;
  eventTypes: typeof EnsEventsEnum = EnsEventsEnum;
  hasDomainsListLoaded = false;
  metadataForm: FormGroup;
  metadata;
  userDomains;
  userDomainOwner;
  events;
  eventActors;
  getUserDomainsSubscripton;
  resolveEventsSubscription;
  resolveMetadataSubscription;
  resolveEventActorsSubscription;
  bookmarkStateSubscription;
  activatedRouteSubscription;

  constructor(
    protected bookmarkFacadeService: ENSBookmarkFacadeService,
    protected registrationService: RegistrationServiceService,
    protected bookmarkStore: Store<ENSBookmarkStateModel>,
    protected userService: UserService,
    protected ensService: EnsService,
    protected pagesFacade: PagesFacadeService,
    protected registrationDataService: RegistrationDataService,
    protected activatedRoute: ActivatedRoute,
    protected timeAgoService: TimeAgoPipe,
    protected router: Router,
    protected snackBar: MatSnackBar,
    public bookmarksService: BookmarksServiceService,
    public canvasService: CanvasServicesService
  ) {
    this.metadataForm = new FormGroup({
      creation: new FormControl({ disabled: true, value: '' }),
      registration: new FormControl({ disabled: true, value: '' }),
      expiration: new FormControl({ disabled: true, value: '' }),
    });
  }

  ngOnInit(): void {
    if (this.domain === false) {
      return;
    }
    this.loadBookmarks();
    this.activatedRouteSubscription = this.activatedRoute.params
      .pipe(
        map((p) => {
          this.pageReset();
          this.getUserDomainData();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.activatedRouteSubscription) {
      this.activatedRouteSubscription.unsubscribe();
    }
    if (this.resolveMetadataSubscription) {
      this.resolveMetadataSubscription.unsubscribe();
    }
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
    if (this.resolveEventsSubscription) {
      this.resolveEventsSubscription.unsubscribe();
    }
    if (this.resolveEventActorsSubscription) {
      this.resolveEventActorsSubscription.unsubscribe();
    }
  }

  pageReset() {
    this.resolvedEvents = [];
    this.hasDomainsListLoaded = false;
    this.metadata = undefined;
    this.userDomains = undefined;
    this.userDomainOwner = undefined;
    this.events = undefined;
    this.eventActors = undefined;
  }

  getUserDomainData() {
    if (this.getUserDomainsSubscripton) {
      this.getUserDomainsSubscripton.unsubscribe();
    }
    let retries = 0;
    this.getUserDomainsSubscripton = of(this.domain)
      .pipe(
        switchMap((r) => {
          return this.ensService.getDomain(
            (r as string).toLowerCase().replace('.eth', '')
          );
        }),
        map((r) => {
          if ((r as any).registrations.length <= 0) {
            this.pagesFacade.gotoPageRoute('not-found', PagesEnum.NOTFOUND);
            return;
          }
          this.userDomains = (r as any).registrations.map((d) => {
            const gPeriod = this.ensService.calculateGracePeriodPercentage(
              parseInt(d.expiryDate, 10)
            );
            const fData = {
              id: d.id.toLowerCase(),
              labelName: d.labelName.toLowerCase(),
              labelHash: d.domain.labelhash.toLowerCase(),
              isAvailable: false,
              expiry: d.expiryDate,
              gracePeriodPercent:
                gPeriod < -100 ? undefined : 100 - Math.abs(gPeriod),
              registrationDate: d.registrationDate,
              createdAt: d.domain.createdAt,
              owner: d.registrant.id,
              events: d.events,
            } as ENSDomainMetadataModel;
            this.hasDomainsListLoaded = true;
            return fData;
          });
          this.injectDomainMetadataToForm();
          const uniqueEvents = {};
          this.userDomains[0].events
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .map((e) => {
              if (e.blockNumber in uniqueEvents === false) {
                uniqueEvents[e.blockNumber] = e;
              }
            });

          this.getDomainMetadata(this.userDomains[0]);
          this.events = Object.keys(uniqueEvents).map((e) => uniqueEvents[e]);
          this.resolveAllEvents(
            this.userDomains[0].labelHash,
            this.userDomains[0].owner
          );
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxRPCCallRetries),
            delayWhen((e) => {
              this.pageReset();
              if (retries >= generalConfigurations.maxRPCCallRetries - 1) {
                this.pagesFacade.setPageCriticalError(true);
              }
              retries++;
              return timer(generalConfigurations.timeToUpdateCheckoutPipe);
            })
          )
        )
      )
      .subscribe();
  }

  injectDomainMetadataToForm() {
    this.metadataForm.controls.creation.setValue(
      this.timeAgoService.transform(
        (parseInt(this.userDomains[0].createdAt) * 1000).toString()
      )
    );
    this.metadataForm.controls.registration.setValue(
      this.timeAgoService.transform(
        (parseInt(this.userDomains[0].registrationDate) * 1000).toString()
      )
    );
    this.metadataForm.controls.expiration.setValue(
      this.timeAgoService.transform(
        (parseInt(this.userDomains[0].expiry) * 1000).toString()
      )
    );
  }

  resolveAllEvents(labelHash: string, owner: string) {
    if (this.resolveEventsSubscription) {
      this.resolveEventsSubscription.unsubscribe();
    }
    const provider = globalAny.canvasProvider;
    const resolved = new Subject();
    let resolvingEvents = false;
    let currentEventToResolve = 0;
    let eventsToResolveCount = this.events.length;
    this.resolveEventsSubscription = interval(500)
      .pipe(
        takeUntil(resolved),
        filter((i) => {
          if (resolvingEvents === true) {
            return false;
          }
          resolvingEvents = true;
          return true;
        }),
        switchMap((i) => {
          return provider.getBlock(
            this.events[currentEventToResolve].blockNumber
          );
        }),
        switchMap((r) => {
          if (r === false) {
            throw 1;
          }
          return from(
            provider.getTransactionReceipt(
              this.events[currentEventToResolve].transactionID
            )
          ).pipe(
            switchMap((rr) => {
              if (rr === false) {
                return of(false);
              }
              return of({ ...(rr as any), ...(r as any) });
            })
          );
        }),
        switchMap((r) => {
          if (r === false) {
            throw 1;
          }
          return from(
            provider.getTransaction(
              this.events[currentEventToResolve].transactionID
            )
          ).pipe(
            switchMap((rr) => {
              if (rr === false) {
                return of(false);
              }
              return of({ ...(rr as any), ...(r as any) });
            })
          );
        }),
        map((r) => {
          if (r === false) {
            throw 1;
          }
          this.resolvedEvents = this.resolvedEvents.concat(
            this.registrationDataService.resolevTxType(
              labelHash,
              owner,
              r as any
            )
          );
          currentEventToResolve++;
          if (currentEventToResolve >= eventsToResolveCount) {
            this.resolvedEvents = this.resolvedEvents.reverse();
            this.getEventsActors(this.resolvedEvents);
            resolved.next(false);
          }
          resolvingEvents = false;
        }),
        catchError((e) => {
          return of(e);
        })
      )
      .subscribe();
  }

  getEventsActors(events: ENSEventModel[]) {
    const addresses = {};
    const resolvedNamesOfActors = {};
    for (const e of events) {
      if (e.from in addresses === false) {
        addresses[e.from] = e.from;
      }
      if (e.to in addresses === false) {
        addresses[e.to] = e.to;
      }
    }
    if (this.resolveEventActorsSubscription) {
      this.resolveEventActorsSubscription.unsubscribe();
    }
    const provider = globalAny.canvasProvider;
    const resolved = new Subject();
    let resolvingActors = false;
    let currentActorToResolve = 0;
    let actorsToResolveCount = Object.keys(addresses).length;
    this.resolveEventActorsSubscription = interval(500)
      .pipe(
        takeUntil(resolved),
        filter((i) => {
          if (resolvingActors === true) {
            return false;
          }
          resolvingActors = true;
          return true;
        }),
        switchMap((i) => {
          const actor = Object.keys(addresses)[currentActorToResolve];
          if (actor === null) {
            return payNoMarketAddress;
          }
          return this.userService.getEthName(provider, actor);
        }),
        map((r) => {
          const actor = Object.keys(addresses)[currentActorToResolve];
          if (r === false || r === null) {
            resolvedNamesOfActors[actor] = actor;
          } else {
            resolvedNamesOfActors[actor] = r;
          }
          currentActorToResolve++;
          if (currentActorToResolve >= actorsToResolveCount) {
            this.eventActors = resolvedNamesOfActors;
            this.resolveLatestDomainOwner();
            resolved.next(false);
          }
          resolvingActors = false;
        }),
        catchError((e) => {
          return of(e);
        })
      )
      .subscribe();
  }

  loadBookmarks() {
    this.bookmarkStateSubscription =
      this.bookmarkFacadeService.getENSBookmarkState$
        .pipe(
          withLatestFrom(this.bookmarkStore.pipe(select(getENSBookmarks))),
          map((state) => {
            const [bookmarkState, bookmarks] = state;
            this.bookmarks = bookmarks;
          })
        )
        .subscribe();
  }

  toggleBookmark(domain: ENSDomainMetadataModel) {
    if (
      this.bookmarksService.isDomainBookmarked(
        this.bookmarks,
        domain.labelName
      ) === true
    ) {
      this.bookmarkFacadeService.removeBookmark(domain);
      return;
    }
    this.bookmarkFacadeService.upsertBookmark(domain);
  }

  resolveLatestDomainOwner() {
    const owners = this.resolvedEvents.map((e) => {
      if (
        e.type === EnsEventsEnum.TRANSFER ||
        e.type === EnsEventsEnum.REGISTRATION ||
        e.type === EnsEventsEnum.SALE
      ) {
        return e.to;
      }
    });
    this.userDomainOwner = owners[0];
  }

  countBookmarks() {
    return this.bookmarksService.countBookmarks();
  }

  countRegistrations() {
    return this.registrationService.countRegistrations();
  }

  goToHome() {
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  hashToBigIntString(hash: string) {
    return ethers.BigNumber.from(hash).toString();
  }

  getEventMsDate(timeStamp: number) {
    return (timeStamp * 1000).toString();
  }

  goToEtherscan(hash: string) {
    window.open(
      BlockExplorersEnum[environment.defaultChain] + 'tx/' + hash,
      '_blank'
    );
  }

  goToEventActorProfile(address: string) {
    window.open('/#/profile/' + address, '_blank');
  }

  goToEtherscanDomainProfile(domain: string) {
    window.open(
      BlockExplorersEnum[environment.defaultChain] +
        '/enslookup-search?search=' +
        domain,
      '_blank'
    );
  }

  goToEnsDomainProfile(domain: string) {
    window.open(
      environment.networks[environment.defaultChain].ensApp +
        '/name/' +
        domain +
        '/details',
      '_blank'
    );
  }

  copyShareLink() {
    const href = this.router.url;
    navigator.clipboard.writeText(environment.baseUrl + '/#' + href);
    this.snackBar.open('URL link copied.', 'close', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 15000000000,
    });
  }

  getDomainMetadata(domain: ENSDomainMetadataModel) {
    if (this.resolveMetadataSubscription) {
      this.resolveMetadataSubscription.unsubscribe();
    }
    this.resolveMetadataSubscription = this.ensService
      .getDomainMetadata(domain.labelHash)
      .pipe(
        map((r) => {
          if (r === false) {
            return;
          }
          this.metadata = r;
        })
      )
      .subscribe();
  }

  getDomainHistoryRecordActor(actor: string) {
    if (actor === null) {
      return { name: 'NULL Address', accessible: false };
    } else if (actor === ENSContracts.registrarController.toLowerCase()) {
      return { name: 'ENS Registrar', accessible: false };
    } else if (actor === ENSContracts.migrationContract.toLowerCase()) {
      return { name: 'ENS Migration', accessible: false };
    }
    return { name: this.eventActors[actor], accessible: true };
  }

  shortenAddress(address: string) {
    return address.substring(6);
  }

  get domainBookable() {
    if (this.userDomains === undefined || this.userDomains.length <= 0) {
      return false;
    }
    return { ...this.userDomains[0], id: this.userDomains[0].labelName };
  }

  get domainIsInvalid() {
    if (this.metadata === undefined) {
      return undefined;
    }
    return this.metadata.description.indexOf('ATTENTION') > -1;
  }

  get domain() {
    if ('domain' in this.activatedRoute.snapshot.params === false) {
      return false;
    }
    const domain = this.activatedRoute.snapshot.params.domain;
    return domain;
  }
}
