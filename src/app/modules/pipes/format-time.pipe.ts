import { DatePipe } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "formatTime",
})
export class FormatTimePipe extends DatePipe implements PipeTransform {
  transform(value: string): any {
    if (value) {
      const inputDate = new Date(value);

      return super.transform(inputDate, "MMM d y HH:MM");
    }
  }
}
