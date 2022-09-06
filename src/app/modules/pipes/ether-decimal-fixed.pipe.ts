import { Pipe, PipeTransform } from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en);

@Pipe({
  name: 'fixedEther',
})
export class EtherDecimalFixedPipe implements PipeTransform {
  transform(value: number): any {
    return value.toFixed(6);
  }
}
