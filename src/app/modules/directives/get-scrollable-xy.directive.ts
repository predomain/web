import {
  Directive,
  EventEmitter,
  Output,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';

@Directive({
  selector: '[appGetScrollableXy]',
})
export class GetScrollableXyDirective implements OnDestroy, AfterViewInit {
  checker;
  @Output() scrollPosition: EventEmitter<number[]> = new EventEmitter<
    number[]
  >();

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.checker = setInterval(() => {
      this.scrollPosition.emit([
        this.elementRef.nativeElement.scrollLeft,
        this.elementRef.nativeElement.scrollTop,
      ]);
    }, 100);
  }

  ngOnDestroy() {
    clearInterval(this.checker);
  }
}
