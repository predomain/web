import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { NavigatorButtonsEnum } from '../../models/states/navigator-interfaces';

@Component({
  selector: 'app-navigator-button',
  templateUrl: './navigator-button.component.html',
  styleUrls: ['./navigator-button.component.scss'],
})
export class NavigatorButtonComponent implements OnInit {
  @Input() isDisabled = false;
  @Input() isHidden = false;
  @Input() buttonId: NavigatorButtonsEnum = NavigatorButtonsEnum.UNUSED;
  @Input() buttonText = 'BUTTON.EMPTY';
  @Input() buttonTextModified: string;
  constructor(public changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {}

  buttonChanged() {
    this.changeDetectorRef.detectChanges();
  }
}
