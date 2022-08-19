import { Injectable } from '@angular/core';
import { MiscUtilsService } from '../misc-utils';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(protected mistUtils: MiscUtilsService) {}

  download(meta: string, dataRaw: any) {
    const data = new TextEncoder().encode(dataRaw);
    const blob = new Blob(['\uFEFF', data], {
      type: 'text/csv;charset=utf-8',
    });
    var fileURL = URL.createObjectURL(blob);
    window.open(fileURL, '_target');
  }
}
