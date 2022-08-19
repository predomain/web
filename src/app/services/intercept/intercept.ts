import { Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { UserFacadeService } from '../../store/facades';

@Injectable({ providedIn: 'root' })
export class Intercept implements HttpInterceptor {
  constructor(router: Router, public userFacade: UserFacadeService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req);
  }
}
