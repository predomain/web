import { Pipe, PipeTransform } from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en);

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string): any {
    const timeAgo = new TimeAgo('en-US');
    if (value) {
      const time = timeAgo.format(new Date(parseInt(value)));
      return time;
    }
  }
}
