import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  dataNodeEndpoints,
  generalConfigurations,
} from 'src/app/configurations';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoriesDataService {
  constructor(protected httpClient: HttpClient) {}

  pingCategoriesDataProviders(endPoints: string[]) {
    let useEnpoints = endPoints;
    if (environment.development === true) {
      useEnpoints = [generalConfigurations.categoiesDataSourceFallback];
    }
    const endPointRequests = useEnpoints.map((e) => {
      return this.httpClient.get([e, dataNodeEndpoints.ping].join('/')).pipe(
        switchMap((r) => of({ provider: e, result: r })),
        catchError((e) => {
          return of(false);
        })
      );
    });
    return forkJoin(endPointRequests);
  }

  getCategoriesIpfsMetadata(endPoint: string, category: string) {
    if (generalConfigurations.categoriesUseFallback === true) {
      return this.httpClient
        .get('assets/categories/' + category + '-meta.json')
        .pipe(
          switchMap((r) => {
            return of(r);
          }),
          catchError((e) => {
            return of(false);
          })
        );
    }
    return this.httpClient.get(endPoint).pipe(
      switchMap((r) => of(r)),
      catchError((e) => {
        return of(false);
      })
    );
  }

  getCategoriesRootVolumeData(endPoint: string) {
    let useEnpoint = endPoint;
    if (environment.development === true) {
      useEnpoint = generalConfigurations.categoiesDataSourceFallback;
    }
    return this.httpClient
      .get(
        [
          useEnpoint,
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
    let useEnpoint = endPoint;
    if (environment.development === true) {
      useEnpoint = generalConfigurations.categoiesDataSourceFallback;
    }
    return this.httpClient
      .get(
        [
          useEnpoint,
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

  getCategoriesRootFallbackData() {
    return this.httpClient.get('assets/categories/root.json').pipe(
      switchMap((r) => of(r)),
      catchError((e) => {
        return of(false);
      })
    );
  }
}
