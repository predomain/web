import { TestBed } from '@angular/core/testing';

import { CheckoutServicesService } from './checkout-services.service';

describe('CheckoutServicesService', () => {
  let service: CheckoutServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckoutServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
