import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BigNumber } from 'ethers';
import { of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { InputTypesEnum } from 'src/app/models/custom-adderss-dialog';
import { MiscUtilsService } from 'src/app/services';
import { CustomAddressComponent } from 'src/app/widgets/custom-address';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CanvasServicesService {
  customAddressDialogRef: MatDialogRef<CustomAddressComponent>;
  customAddressDialogSubscription;
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;

  constructor(
    public dialog: MatDialog,
    protected miscUtils: MiscUtilsService
  ) {}

  getImage(domain: any) {
    return this.ensMetadataAPI + domain.labelhash + '/image';
  }

  getImageHash(imageDisplayStr: string) {
    return imageDisplayStr
      .replace(this.ensMetadataAPI, '')
      .replace('/image', '');
  }

  getImagePriceSize(gridSize: number) {
    switch (gridSize) {
      case 3:
        {
          return 50;
        }
        break;
      case 2:
        {
          return 33;
        }
        break;
      case 1:
        {
          return 25;
        }
        break;
    }
  }

  hexToRgbA(hex, alpha: number = 1) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return (
        'rgba(' +
        [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') +
        ',' +
        alpha +
        ')'
      );
    }
    throw new Error('Bad Hex');
  }

  openCustomAddressDialog(
    label: string,
    errorLabel: string,
    callback: any = (p) => {},
    defaultValueSet = null,
    inputType: InputTypesEnum = InputTypesEnum.ALPHA_NUMERIC
  ) {
    this.customAddressDialogRef = this.dialog.open(CustomAddressComponent, {
      data: {
        label,
        errorLabel,
        defaultValue: defaultValueSet,
        inputType,
      },
      panelClass: 'cos-onboard-dialog',
    });
    const dialog = this.customAddressDialogRef.componentInstance;
    const dialogInteractionCompleted = new Subject<boolean>();
    this.customAddressDialogSubscription = dialog.textInput
      .pipe(
        takeUntil(dialogInteractionCompleted),
        switchMap((entry) => {
          return of(entry).pipe(
            filter((t) => {
              switch (inputType) {
                case InputTypesEnum.ALPHABET:
                  {
                    if (this.miscUtils.testAlpha().test(t) === false) {
                      throw false;
                    }
                  }
                  break;
                case InputTypesEnum.ALPHA_NUMERIC:
                  {
                    if (this.miscUtils.testAlphaNumeric().test(t) === false) {
                      throw false;
                    }
                  }
                  break;
                case InputTypesEnum.NUMERIC:
                  {
                    if (this.miscUtils.testNumeric().test(t) === false) {
                      throw false;
                    }
                  }
                  break;
              }
              return true;
            }),
            switchMap((t) => callback(t)),
            filter((r) => {
              if (r === false) {
                throw false;
              }
              return true;
            }),
            map((t) => {
              dialog.closeDialog();
              dialogInteractionCompleted.next(false);
              dialogInteractionCompleted.complete();
            }),
            catchError((e) => {
              dialog.invalidEntry = true;
              dialog.formLock = false;
              return of(e);
            })
          );
        })
      )
      .subscribe();
    this.customAddressDialogRef.afterClosed().subscribe((r) => {
      dialogInteractionCompleted.next(false);
      this.customAddressDialogSubscription.unsubscribe();
      this.customAddressDialogSubscription = undefined;
    });
  }

  getDomainPrice(domainName: string, prices: any) {
    if (domainName in prices === false) {
      return '';
    }
    return prices[domainName];
  }

  isImageInDisplayed(imageHash: string, displayedImages: string[]) {
    if (displayedImages === null || displayedImages === undefined) {
      return false;
    }
    const img = this.ensMetadataAPI + imageHash + '/image';
    if (displayedImages.indexOf(img) > -1) {
      return true;
    }
    return false;
  }

  getDomainTokenId(domainhash: string) {
    return BigNumber.from(domainhash).toString();
  }

  getDomainFromHash(hash: string, domains: any) {
    return domains.filter((d) => {
      if (d.labelhash === hash) {
        return true;
      }
      return false;
    });
  }

  getWidthOfDiv(divId: string) {
    return document.getElementById(divId).clientWidth;
  }
}
