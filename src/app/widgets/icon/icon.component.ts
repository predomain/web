import {
  AfterViewChecked,
  Component,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { from, interval, of, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { infiniteLoopedIcons } from 'src/app/configurations';
import { NonceTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { IconRegistryService, WalletService } from 'src/app/services';

declare const APNG: any;

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent implements OnDestroy, AfterViewChecked {
  @Input() iconSize = 24;
  @ViewChild('icon', { static: false }) icon: any;
  isVisible = false;
  setIcon;
  iconsRegistry;
  iconAnimation;
  checkIconSubscription;
  iconId;

  constructor(
    public iconRegistryService: IconRegistryService,
    public walletService: WalletService
  ) {
    this.iconsRegistry = this.iconRegistryService.injectCustomIcons();
    this.iconId = walletService.produceNonce(NonceTypesEnum.SERIAL);
    const stopCheck: Subject<boolean> = new Subject<boolean>();
    this.checkIconSubscription = interval(1)
      .pipe(
        takeUntil(stopCheck),
        switchMap((i) => {
          if (this.icon === undefined) {
            return of(false);
          }
          if (
            'nativeElement' in this.icon === false ||
            this.icon.nativeElement.innerText === ''
          ) {
            return of(false);
          }
          this.setIcon = this.icon.nativeElement.innerText.replaceAll(' ', '');
          const canvas = document.getElementById(
            'canvas-icon-' + this.setIcon + this.iconId
          ) as HTMLCanvasElement;
          if (canvas === null) {
            return of(false);
          }
          return from(
            APNG.parseURL('../../../' + this.iconsRegistry[this.setIcon])
          );
        }),
        map((apng: any) => {
          if (apng === false) {
            return;
          }
          const canvas = document.getElementById(
            'canvas-icon-' + this.setIcon + this.iconId
          ) as HTMLCanvasElement;
          canvas.width = apng.width;
          canvas.height = apng.height;
          this.iconAnimation = apng;
          this.iconAnimation.addContext(canvas.getContext('2d'));
          this.playIcon();
          stopCheck.next(false);
          stopCheck.complete();
          return;
        })
      )
      .subscribe();
  }

  playIcon() {
    this.iconAnimation.play();
    if (infiniteLoopedIcons.indexOf(this.setIcon) > -1) {
      return;
    }
    setTimeout(() => {
      this.iconAnimation.rewind();
    }, this.iconAnimation.frames.length * 25);
    return;
  }

  ngAfterViewChecked() {
    if (this.iconAnimation === undefined && this.icon !== undefined) {
      return;
    }

    if (
      this.isVisible == false &&
      this.icon.nativeElement.offsetParent != null
    ) {
      this.isVisible = true;
      this.playIcon();
    } else if (
      this.isVisible == true &&
      this.icon.nativeElement.offsetParent == null
    ) {
      this.isVisible = false;
    }
  }

  ngOnDestroy() {
    if (this.checkIconSubscription) {
      this.checkIconSubscription.unsubscribe();
      this.checkIconSubscription = undefined;
    }
  }
}
