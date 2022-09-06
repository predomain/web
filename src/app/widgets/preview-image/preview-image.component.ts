import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { generalConfigurations } from 'src/app/configurations';

@Component({
  selector: 'app-preview-image',
  templateUrl: './preview-image.component.html',
  styleUrls: ['./preview-image.component.scss'],
})
export class PreviewImageComponent implements OnChanges {
  @Input() src;
  @Input() preview;
  @Input() error;
  @Input() errored = false;
  @Input() loaded = false;
  @Input() dontLoad = false;
  @Output() imageLoaded = new EventEmitter<boolean>();

  constructor(public changeDetectorRef: ChangeDetectorRef) {}

  setError() {
    setTimeout(() => {
      if (this.loaded === false && this.errored === false) {
        this.errored = true;
      }
      this.imageLoaded.emit(true);
    }, generalConfigurations.timeUntilImageLoadErrors);
  }

  ngOnChanges() {
    if (this.loaded === true || this.errored === true) {
      this.imageLoaded.emit(true);
      this.loaded = false;
    }
  }

  markCheck() {
    this.changeDetectorRef.markForCheck();
  }
}
