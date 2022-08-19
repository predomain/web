import { TestBed } from '@angular/core/testing';

import { EnsService } from './ens.service';

describe('EnsService', () => {
  let service: EnsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
