import { Pipe, PipeTransform } from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import { FormatTimePipe } from './format-time.pipe';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  constructor(protected formatTimePipe: FormatTimePipe) {}

  transform(value: string): any {
    const timeAgo = new TimeAgo('en-GB');
    if (value) {
      const time = timeAgo.format(new Date(parseInt(value)));
      if (time.toLowerCase().indexOf('year') > -1) {
        return this.formatTimePipe.transform(value);
      }
      return time;
    }
  }
}
