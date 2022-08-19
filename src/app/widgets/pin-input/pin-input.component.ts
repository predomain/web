import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChildren,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'app-pin-input',
  templateUrl: './pin-input.component.html',
  styleUrls: ['./pin-input.component.scss'],
})
export class PinInputComponent {
  @Output() pin: EventEmitter<string> = new EventEmitter<string>();
  @Output() pinSubtextClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @ViewChildren('mobilityInput') mobilityInput;
  @Input() inputValueIsShown = false;
  @Input() showPinPad = true;
  @Input() fluidSize = false;
  @Input() subtextIsLoadingIcon = false;
  @Input() pinClickableSubtextIsLink = true;
  @Input() pinClickableSubtextEnabled = '';
  @Input() pinClickableSubtextToolTip = '';
  pinInput: string[] = [];
  constructor() {}

  addPin(key: string) {
    if (this.pinInput.length < 6) {
      this.pinInput.push(key);
      this.pin.emit(this.pinInput.length > 0 ? this.pinInput.join('') : '');
    }
  }

  addPinMobility(e: any, pinPosition: number) {
    if (this.pinInput.length < 6) {
      this.pinInput.push(e.data);
      (document.activeElement as any).blur();
      this.pin.emit(this.pinInput.length > 0 ? this.pinInput.join('') : '');
      if (this.showPinPad === true) {
        return;
      }
      const mobilityInputs = [];
      for (const mi of this.mobilityInput) {
        mobilityInputs.push(mi);
      }
      if (this.pinInput.length < 6) {
        mobilityInputs[pinPosition + 1].nativeElement.focus();
      }
    }
  }

  removeLastPin() {
    if (this.pinInput.length > 0) {
      if (this.showPinPad === false) {
        const mobilityInputs = [];
        for (const mi of this.mobilityInput) {
          mobilityInputs.push(mi);
        }
        if (this.pinInput.length > -1) {
          mobilityInputs[this.pinInput.length - 1].nativeElement.focus();
        }
      }
      this.pinInput.splice(this.pinInput.length - 1, 1);
      this.pin.emit(this.pinInput.length > 0 ? this.pinInput.join('') : '');
    }
  }

  detectBackSpace(e: any, pinPosition: number) {
    if (e.code === 'Backspace') {
      this.removeLastPin();
    }
  }

  resetInputs() {
    this.pinInput = [];
    this.pin.emit('');
  }

  subtextClick() {
    this.pinSubtextClicked.emit(true);
  }

  getFieldInputClass(pinPosition: number) {
    const classes = {};
    if (
      this.pinInput.length > pinPosition &&
      this.pinInput[pinPosition].length > 0 &&
      this.inputValueIsShown === false
    ) {
      classes['co-pin-filled'] = true;
    }
    if (this.inputValueIsShown === true) {
      classes['co-pin-input-value-show-field'] = true;
    } else {
      classes['co-pin-input-field'] = true;
    }
    return classes;
  }

  getFieldInputClassMobility(pinPosition: number) {
    const classes = {};
    if (
      this.pinInput.length > pinPosition &&
      this.pinInput[pinPosition].length > 0 &&
      this.inputValueIsShown === false
    ) {
      classes['co-pin-filled'] = true;
    }
    if (this.inputValueIsShown === true) {
      classes['co-pin-input-value-show-field'] = true;
    } else {
      classes['co-pin-input-field'] = true;
    }
    return classes;
  }

  validatePin() {
    if (this.pinInput === undefined) {
      return false;
    }
    if (this.pinInput.length < 6) {
      return false;
    }
    return true;
  }
}
