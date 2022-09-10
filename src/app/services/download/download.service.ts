import { Injectable } from '@angular/core';
import { MiscUtilsService } from '../misc-utils';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(protected mistUtils: MiscUtilsService) {}

  download(meta: string, dataRaw: any, fileName = null) {
    const data = new TextEncoder().encode(dataRaw);
    const blob = new Blob(['\uFEFF', data], {
      type: meta,
    });
    let fileURL;
    if (fileName === null) {
      fileURL = URL.createObjectURL(blob);
    } else {
      fileURL = meta;
    }
    window.open(fileURL, '_target');
  }
}
