import {
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

  setError() {
    setTimeout(() => {
      if (this.loaded === false && this.errored === false) {
        this.errored = true;
      }
    }, generalConfigurations.timeUntilImageLoadErrors);
  }

  ngOnChanges() {
    if (this.loaded === true) {
      this.imageLoaded.emit(true);
      this.loaded = false;
    }
  }
}
