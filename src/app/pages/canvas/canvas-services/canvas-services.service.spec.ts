import { TestBed } from '@angular/core/testing';

import { CanvasServicesService } from './canvas-services.service';

describe('CanvasServicesService', () => {
  let service: CanvasServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
