import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  dataNodeEndpoints,
  generalConfigurations,
} from 'src/app/configurations';

@Injectable({
  providedIn: 'root',
})
export class CategoriesDataService {
  constructor(protected httpClient: HttpClient) {}

  pingCategoriesDataProviders(endPoints: string[]) {
    const endPointRequests = endPoints.map((e) => {
      return this.httpClient.get([e, dataNodeEndpoints.ping].join('/')).pipe(
        switchMap((r) => of({ provider: e, result: r })),
        catchError((e) => {
          return of(false);
        })
      );
    });
    return forkJoin(endPointRequests);
  }

  getCategoriesIpfsMetadata(endPoint: string) {
    return this.httpClient.get(endPoint).pipe(
      switchMap((r) => of(r)),
      catchError((e) => {
        return of(false);
      })
    );
  }
  getCategoriesRootVolumeData(endPoint: string) {
    return this.httpClient
      .get(
        [
          endPoint,
          dataNodeEndpoints.checkout,
          'root_volume',
          'root_volume',
        ].join('/')
      )
      .pipe(
        switchMap((r) => of(r)),
        catchError((e) => {
          return of(false);
        })
      );
  }

  getCategoriesData(endPoint: string, collection: string) {
    return this.httpClient
      .get(
        [
          endPoint,
          dataNodeEndpoints.checkout,
          'collections',
          collection + '.' + generalConfigurations.categoriesDomain,
        ].join('/')
      )
      .pipe(
        switchMap((r) => of(r)),
        catchError((e) => {
          return of(false);
        })
      );
  }
}
