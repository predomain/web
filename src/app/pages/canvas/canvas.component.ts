import html2canvas from 'html2canvas';
import { from, of, Subject, timer } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { OnboardDialogComponent } from 'src/app/widgets/onboard-dialog';
import { UserModel } from '../../models/states/user-interfaces';
import { UserService } from '../../services';
import { PagesFacadeService, UserFacadeService } from '../../store/facades';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PricesModel } from 'src/app/models/canvas';
import { CanvasServicesService } from './canvas-services/canvas-services.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { EnsService } from 'src/app/services/ens';
import { SpinnerModesEnum } from 'src/app/models/spinner';
import { PagesEnum } from 'src/app/models/states/pages-interfaces';
import { environment } from 'src/environments/environment';

const globalAny: any = global;

export enum qrLinkEnums {
  OPENSEA = 'https://opensea.io/assets/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/',
  LOOKSRARE = 'https://looksrare.org/collections/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85/',
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.drawSelectedImageCanvas();
  }

  @ViewChild('qrCode') qrCode: QRCodeComponent;
  spinnerModes: typeof SpinnerModesEnum = SpinnerModesEnum;
  currentUserData: UserModel;
  searchForm: FormGroup;
  images: string[] = [];
  displayedImages: string[] = [];
  rawImageStorage = [];
  domains: any = [];
  selectedDomain;
  gridSettings = 1;
  gridSize = 4;
  imgR = 900 / 4;
  downloading = false;
  showSelected = false;
  displayImageLoaded = false;
  priceColors: any = {};
  prices: PricesModel = {};
  qrCodes = {};
  qrLinks = {};
  qrColors = {};
  currentQrColor = '#ffffff';
  currentPriceColor = '#ffffff';
  ensMetadataAPI =
    environment.networks[environment.defaultChain].ensMetadataAPI;
  disabled = false;
  selectedImageCanvas;
  ethName;
  ethNameBlockAddress;
  customName;
  userStateSubscription;
  pagesStateSubscription;
  captureSusbcription;

  constructor(
    public canvasServices: CanvasServicesService,
    public userFacadeService: UserFacadeService,
    public pagesFacadeService: PagesFacadeService,
    public userService: UserService,
    public snackBar: MatSnackBar,
    public detector: ChangeDetectorRef,
    public ensService: EnsService,
    public dialog: MatDialog,
    public ngZone: NgZone
  ) {
    this.searchForm = new FormGroup({
      search: new FormControl(''),
    });
  }

  ngOnInit() {
    this.checkEthName();
    this.createSelectedImageCanvas();
  }

  ngAfterViewInit() {
    this.userStateSubscription = this.userFacadeService.userState$
      .pipe(
        switchMap((s) => {
          if (
            this.currentUserData !== undefined &&
            'walletAddress' in s.user === undefined
          ) {
            this.images = [];
            this.domains = [];
            this.displayedImages = [];
            this.currentUserData = undefined;
            this.selectedDomain = undefined;
            document.getElementById('canvas_ht').innerHTML = '';
          }
          if (this.currentUserData !== undefined) {
            this.images = [];
            this.domains = [];
            this.displayedImages = [];
            this.selectedDomain = undefined;
            document.getElementById('canvas_ht').innerHTML = '';
            this.customName = this.currentUserData.walletAddress;
            this.ethNameBlockAddress = this.customName;
            this.checkEthName();
          }
          if ('walletAddress' in s.user && s.user.walletAddress !== undefined) {
            this.currentUserData = s.user;
            return this.userService.getUserDomains(
              (this.currentUserData.walletAddress as string).toLowerCase()
            );
          }
          return of(false);
        }),
        map((r: any) => {
          if (r === false) {
            return;
          }
          r.registrations.map((r, i) => {
            this.images.push(
              this.ensMetadataAPI + r.domain.labelhash + '/image'
            );
            this.domains.push(r.domain);
          });
          this.displayedImages = this.images.splice(0, 25);
          this.load();
          this.displayImageLoaded = false;
          this.selectedDomain = this.canvasServices.getDomainFromHash(
            this.canvasServices.getImageHash(this.displayedImages[0]),
            this.domains
          )[0];
          if (
            this.qrColors !== null &&
            this.selectedDomain in this.qrColors === true
          ) {
            this.currentQrColor = this.qrColors[this.selectedDomain.labelhash];
          }
          this.showImages();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
    }
    if (this.userStateSubscription) {
      this.userStateSubscription.unsubscribe();
    }
  }

  capture(targetElement: string = 'canvas_ht', w = 900, h = 900) {
    this.downloading = true;
    this.captureSusbcription = from(
      html2canvas((document.getElementById(targetElement) as any).firstChild, {
        allowTaint: true,
        width: w,
        height: h,
        removeContainer: true,
        backgroundColor: null,
        imageTimeout: 500000,
        logging: true,
        scale: 1,
        useCORS: true,
        scrollY: -window.scrollY,
      })
    )
      .pipe(
        map((canvas) => {
          var byteCharacters = atob(
            canvas.toDataURL().replace('data:image/png;base64,', '')
          );
          var byteNumbers = new Array(byteCharacters.length);
          for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          var byteArray = new Uint8Array(byteNumbers);
          var file = new Blob([byteArray], { type: 'image/png;base64' });
          var fileURL = URL.createObjectURL(file);
          window.open(fileURL, '_target');
          this.downloading = false;
        })
      )
      .subscribe();
  }

  /***********************************
   *                                 *
   * Selected Image Canvas Functions *
   *                                 *
   **********************************/
  createSelectedImageCanvas() {
    this.selectedImageCanvas = document.createElement('canvas');
    this.selectedImageCanvas.style.borderRadius = '10px';
    this.selectedImageCanvas.width = 512;
    this.selectedImageCanvas.height = 512;
  }

  drawSelectedImageCanvas() {
    const ctx = this.selectedImageCanvas.getContext('2d');
    if (this.selectedDomain === undefined) {
      this.displayImageLoaded = true;
      return;
    }
    const drawDisplay = (imgSrc) => {
      const imgRSet = 512;
      ctx.drawImage(imgSrc, 0, 0, imgRSet, imgRSet);
      const priceX = imgRSet / 10;
      const priceY = imgRSet - imgRSet / 4 - (imgRSet / 100) * 3;
      if (this.selectedDomain.labelhash in this.prices === true) {
        this.drawImgPrice(
          ctx,
          priceX + 10,
          priceY,
          this.selectedDomain.labelhash,
          imgRSet / 10,
          this.selectedDomain.labelhash in this.priceColors
            ? this.priceColors[this.selectedDomain.labelhash]
            : '#ffffff'
        );
      }

      if (
        this.selectedDomain.labelhash in this.qrCodes &&
        this.qrCodes[this.selectedDomain.labelhash] === true
      ) {
        this.drawQrCode(
          ctx,
          imgRSet / 20,
          imgRSet / 2 - imgRSet / 20,
          imgRSet / 2,
          imgRSet / 2,
          this.selectedDomain.labelhash
        );
      }
      this.selectedImageCanvas.style.width =
        this.canvasServices.getWidthOfDiv('canvas_size_guide') + 'px';
      this.selectedImageCanvas.style.height =
        this.canvasServices.getWidthOfDiv('canvas_size_guide') + 'px';
      if (document.getElementById('canvas_image_displayed') !== null) {
        document.getElementById('canvas_image_displayed').innerHTML = '';
      }
      document
        .getElementById('canvas_image_displayed')
        .append(this.selectedImageCanvas);
      this.displayImageLoaded = true;
    };
    if (this.selectedDomain.labelhash in this.rawImageStorage === false) {
      const newImg = new Image();
      newImg.onload = () => {
        this.rawImageStorage[this.selectedDomain.labelhash] = newImg;
        drawDisplay(newImg);
      };
      newImg.crossOrigin = '*';
      newImg.src = this.canvasServices.getImage(this.selectedDomain);
    } else {
      drawDisplay(this.rawImageStorage[this.selectedDomain.labelhash]);
    }
  }

  checkEthName() {
    const takePageEntry = new Subject<boolean>();
    let nameIsResolving = false;
    if (this.pagesStateSubscription) {
      this.pagesStateSubscription.unsubscribe();
      this.pagesStateSubscription = undefined;
    }
    this.pagesStateSubscription = timer(0, 100)
      .pipe(
        filter((i) => {
          if (nameIsResolving === true) {
            return false;
          }
          nameIsResolving = true;
          return true;
        }),
        takeUntil(takePageEntry),
        switchMap((s) => {
          if (
            globalAny.canvasProvider === undefined ||
            this.currentUserData === undefined
          ) {
            return of(false);
          }
          return this.userService.getEthName(
            globalAny.canvasProvider,
            this.currentUserData.walletAddress
          );
        }),
        map((r) => {
          nameIsResolving = false;
          if (r === false) {
            if (
              this.currentUserData !== undefined &&
              this.currentUserData.walletAddress !== undefined
            )
              this.ethName = this.currentUserData.walletAddress;
            return;
          }
          if (r === null) {
            this.ethName = this.currentUserData.walletAddress;
            takePageEntry.next(false);
            return;
          }
          this.ethName = r;
          takePageEntry.next(false);
        })
      )
      .subscribe();
  }

  gridSet(setting: number, refreshImages = true) {
    this.gridSettings = setting;
    switch (setting) {
      case 1:
        {
          this.imgR = 900 / 4;
          this.gridSize = 4;
        }
        break;
      case 2:
        {
          this.imgR = 900 / 3;
          this.gridSize = 3;
        }
        break;
      case 3:
        {
          this.imgR = 900 / 2;
          this.gridSize = 2;
        }
        break;
    }
    if (refreshImages === false) {
      return;
    }
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  load() {
    const addr = this.currentUserData.walletAddress;
    const sSettings = localStorage.getItem('canvas-grid-settings');
    const sPrices = localStorage.getItem('canvas-prices-' + addr);
    const sQrCodes = localStorage.getItem('canvas-qrcodes-' + addr);
    const sQrLinks = localStorage.getItem('canvas-qrlinks-' + addr);
    const sPricesColors = localStorage.getItem('canvas-prices-colors-' + addr);
    const sQrColors = localStorage.getItem('canvas-qr-colors-' + addr);
    const sDisplayedImages = localStorage.getItem(
      'canvas-displayed-images-' + addr
    );
    if (sDisplayedImages === null || sDisplayedImages === '') {
      this.snackBar.open('Select images to display.', 'close', {
        horizontalPosition: 'left',
        verticalPosition: 'bottom',
        duration: 15000,
      });
    }
    if (
      sSettings === null ||
      sSettings === '' ||
      sSettings === 'null' ||
      sDisplayedImages === null ||
      sDisplayedImages === '' ||
      sDisplayedImages === 'null'
    ) {
      return;
    }
    if (sPrices !== null && sPrices !== 'null' && sPrices !== '{}') {
      this.prices = JSON.parse(sPrices);
    }
    if (
      sPricesColors !== null &&
      sPricesColors !== 'null' &&
      sPricesColors !== '{}'
    ) {
      this.priceColors = JSON.parse(sPricesColors);
    }
    if (sQrColors !== null && sQrColors !== 'null' && sQrColors !== '{}') {
      this.qrColors = JSON.parse(sQrColors);
    }
    if (sQrCodes !== null && sQrCodes !== 'null' && sQrCodes !== '{}') {
      this.qrCodes = JSON.parse(sQrCodes);
    }
    if (sQrLinks !== null && sQrLinks !== 'null' && sQrLinks !== '{}') {
      this.qrLinks = JSON.parse(sQrLinks);
    }
    this.gridSettings =
      parseInt(sSettings, 10) < 1 ? 0 : parseInt(sSettings, 10);
    this.gridSet(this.gridSettings, false);
    this.displayedImages = JSON.parse(sDisplayedImages);
  }

  save() {
    const addr = this.currentUserData.walletAddress;
    localStorage.setItem(
      'canvas-displayed-images-' + addr,
      JSON.stringify(this.displayedImages)
    );
    localStorage.setItem('canvas-prices-' + addr, JSON.stringify(this.prices));
    localStorage.setItem(
      'canvas-qrlinks-' + addr,
      JSON.stringify(this.qrLinks)
    );
    localStorage.setItem(
      'canvas-qrcodes-' + addr,
      JSON.stringify(this.qrCodes)
    );
    localStorage.setItem(
      'canvas-prices-colors-' + addr,
      JSON.stringify(this.priceColors)
    );
    localStorage.setItem(
      'canvas-qr-colors-' + addr,
      JSON.stringify(this.qrColors)
    );
    localStorage.setItem('canvas-grid-settings', this.gridSettings.toString());
  }

  addDisplayed(imageHash: string) {
    if (this.displayedImages.length >= 25) {
      this.snackBar.open('Maximum of only 25 images possible.', 'close', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 15000,
      });
      return;
    }
    const img = this.ensMetadataAPI + imageHash + '/image';
    this.displayedImages.push(img);
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  removeDisplayed(imageHash: string) {
    const img = this.ensMetadataAPI + imageHash + '/image';
    delete this.displayedImages[this.displayedImages.indexOf(img)];
    this.displayedImages = this.displayedImages.filter((r) => {
      return r !== undefined;
    });
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.domains, event.previousIndex, event.currentIndex);
    this.displayedImages = this.filterSearchOptions('', this.showSelected)
      .filter((d) => {
        const img = this.canvasServices.getImage(d);
        return this.displayedImages.indexOf(img) > -1;
      })
      .map((d) => {
        return this.canvasServices.getImage(d);
      });
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  hideAll() {
    this.snackBar.open('All of your domains are now hidden.', 'close', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 15000,
    });
    this.displayedImages = [];
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  openConnect() {
    const dialogRef = this.dialog.open(OnboardDialogComponent, {
      data: 'ERRORS.UNKNOWN',
      panelClass: 'cos-onboard-dialog',
    });
  }

  showImages() {
    if (this.displayedImages === null || this.displayedImages === undefined) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.style.borderRadius = '10px';
    canvas.width = 900;
    canvas.height = 900;
    const imgRSet = this.imgR;
    const ctx = canvas.getContext('2d');
    const p = 0;
    let count = 0;
    for (let xCell = 0; xCell < this.gridSize; xCell++) {
      for (let yCell = 0; yCell < this.gridSize; yCell++) {
        const x = xCell * imgRSet;
        const y = yCell * imgRSet;
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, y + p, x + p, imgRSet - p * 2, imgRSet - p * 2);
          this.rawImageStorage[(img as any).domain] = img;
          if (
            'domain' in img === true &&
            (img as any).domain in this.qrCodes &&
            this.qrCodes[(img as any).domain] === true
          ) {
            this.drawQrCode(
              ctx,
              x + imgRSet / 20,
              y + imgRSet - p * 2 - imgRSet / 2 - imgRSet / 20,
              imgRSet / 2,
              imgRSet / 2,
              (img as any).domain
            );
          }
          if (
            'domain' in img === true &&
            this.selectedDomain.labelhash === (img as any).domain
          ) {
            this.drawSelectedImageCanvas();
          }
          if (
            (img as any).domain in this.prices === false ||
            'domain' in img === false
          ) {
            return;
          }
          const priceX = y + p + imgRSet / 8;
          const priceY = x + p + (imgRSet - imgRSet / 4) - (imgRSet / 100) * 3;
          this.drawImgPrice(
            ctx,
            priceX,
            priceY,
            (img as any).domain,
            imgRSet / 10,
            this.getDomainPriceColor((img as any).domain)
          );
        };
        const url = this.displayedImages[count];
        img.crossOrigin = '*';
        img.src = url;
        if (count < this.displayedImages.length) {
          (img as any).domain = this.canvasServices.getImageHash(url);
        }
        count++;
      }
    }
    document.getElementById('canvas_ht').appendChild(canvas);
    this.save();
  }

  drawQrCode(ctx, x, y, w, h, domainHash: string) {
    const imgContainer = document.getElementById('qr-code-' + domainHash);
    const img = imgContainer.firstChild.firstChild as any;
    ctx.drawImage(img, y, x, w, h);
  }

  drawImgPrice(
    ctx: any,
    x,
    y,
    domainHash: string,
    fontSize: number,
    color: string
  ) {
    const domainPrice = this.canvasServices.getDomainPrice(
      domainHash,
      this.prices
    );
    ctx.font = 'bold ' + fontSize + 'px os';
    const hexRGBA = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowColor = hexRGBA;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(domainPrice, x, y);
    ctx.shadowBlur = 0;
  }

  filterSearchOptions(value: any = '', pickActiveDomainsOnly = false): any[] {
    if (value === undefined || value === '' || value === null) {
      if (this.showSelected === true || pickActiveDomainsOnly === true) {
        return this.domains.filter((d) => {
          const img = this.canvasServices.getImage(d);
          if (this.displayedImages.indexOf(img) > -1) {
            return true;
          }
          return false;
        }) as any[];
      }
      return this.domains;
    }
    const filterValue = (value as any).search.toLowerCase();
    return this.domains.filter((d) => {
      if (
        this.showSelected === true &&
        d.labelName.toLowerCase().includes(filterValue)
      ) {
        const img = this.canvasServices.getImage(d);
        if (this.displayedImages.indexOf(img) > -1) {
          return true;
        }
        return false;
      }
      return d.labelName.toLowerCase().includes(filterValue);
    }) as any;
  }

  sortDomainsBySearchFilter() {
    const sValue = this.searchForm.controls.search.value;
    if (
      this.showSelected === false &&
      (sValue === '' || sValue === null || sValue === undefined)
    ) {
      return this.domains;
    }
    return this.filterSearchOptions({ search: sValue });
  }

  changeCurrentPriceColor(color: any) {
    this.triggerFilterCheck();
    this.currentPriceColor = color;
    this.priceColors[this.selectedDomain.labelhash] = color;
    if (this.selectedDomain.labelhash in this.prices === false) {
      this.snackBar.open(
        'Make sure to enable the price for your domain.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
    }
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.drawSelectedImageCanvas();
    this.showImages();
  }

  changeAllPriceColor(color: any) {
    this.triggerFilterCheck();
    this.currentPriceColor = color;
    const allSelectedDomains = this.filterSearchOptions(null, true);
    allSelectedDomains.map((d: any) => {
      this.priceColors[d.labelhash] = this.currentPriceColor;
    });
    this.snackBar.open(
      'Make sure to enable the prices for your domains.',
      'close',
      {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 15000,
      }
    );
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.drawSelectedImageCanvas();
    this.showImages();
  }

  changeCurrentQrColor(color: any) {
    this.triggerFilterCheck();
    this.currentQrColor = color;
    this.qrColors[this.selectedDomain.labelhash] = color;
    if (
      this.selectedDomain.labelhash in this.qrCodes &&
      this.qrCodes[this.selectedDomain.labelhash] === false
    ) {
      this.snackBar.open(
        'Make sure to enable the QR for your domain.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
    }
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.drawSelectedImageCanvas();
    this.showImages();
  }

  changeAllQrColor(color: any) {
    this.triggerFilterCheck();
    this.currentQrColor = color;
    const allSelectedDomains = this.filterSearchOptions(null, true);
    allSelectedDomains.map((d: any) => {
      this.qrColors[d.labelhash] = this.currentQrColor;
    });
    this.snackBar.open(
      'Make sure to enable the QR for your domains.',
      'close',
      {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 15000,
      }
    );
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.drawSelectedImageCanvas();
    this.showImages();
  }

  openPriceSettingDialog(setAll: boolean = false) {
    const domain = this.selectedDomain.labelhash;
    this.canvasServices.openCustomAddressDialog(
      'FORM_LABELS.ENTER_PRICE',
      'FORM_ERRORS.INVALID_PRICE',
      (p) => {
        if (p === undefined || p === null) {
          return of(false);
        }
        if (setAll === true) {
          this.domains.map((d) => {
            if (p === '' && d.labelhash in this.prices === true) {
              delete this.prices[d.labelhash];
            } else {
              this.prices[d.labelhash] = p;
            }
          });
        } else {
          this.prices[domain] = p;
        }
        this.save();
        document.getElementById('canvas_ht').innerHTML = '';
        this.showImages();
        this.drawSelectedImageCanvas();
        return of(true);
      }
    );
  }

  openQrLinkSettingDialog() {
    const domain = this.selectedDomain.labelhash;
    this.canvasServices.openCustomAddressDialog(
      'FORM_LABELS.ENTER_QR_LINK',
      'FORM_ERRORS.INVALID_QR_LINK',
      (p) => {
        if (p === '' || p === undefined || p === null) {
          return of(false);
        }
        this.qrLinks[domain] = p;
        this.save();
        document.getElementById('canvas_ht').innerHTML = '';
        this.showImages();
        return of(true);
      }
    );
  }

  setOpenSeaQrLink(setAll: boolean = false) {
    if (this.selectedDomain === undefined) {
      return;
    }
    if (setAll === true) {
      const allSelectedDomains = this.filterSearchOptions(null, true);
      allSelectedDomains.map((d: any) => {
        const domain = d.labelhash;
        const domainId = this.selectedDomain.id;
        this.qrCodes[domain] = true;
        this.qrLinks[domain] =
          qrLinkEnums.OPENSEA + this.canvasServices.getDomainTokenId(domain);
        this.qrColors[d.labelhash] = this.currentQrColor;
      });
    } else {
      const domain = this.selectedDomain.labelhash;
      const domainId = this.selectedDomain.id;
      this.qrCodes[domain] = true;
      this.qrLinks[domain] =
        qrLinkEnums.OPENSEA + this.canvasServices.getDomainTokenId(domain);
    }
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  setLooksrareQrLink(setAll: boolean = false) {
    if (this.selectedDomain === undefined) {
      return;
    }
    if (setAll === true) {
      const allSelectedDomains = this.filterSearchOptions(null, true);
      allSelectedDomains.map((d: any) => {
        const domain = d.labelhash;
        this.qrCodes[domain] = true;
        this.qrLinks[domain] =
          qrLinkEnums.LOOKSRARE + this.canvasServices.getDomainTokenId(domain);
        this.qrColors[d.labelhash] = this.currentQrColor;
      });
    } else {
      const domain = this.selectedDomain.labelhash;
      this.qrCodes[domain] = true;
      this.qrLinks[domain] =
        qrLinkEnums.LOOKSRARE + this.canvasServices.getDomainTokenId(domain);
    }
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    this.showImages();
  }

  setCustomQrLink(qrLink: string) {
    if (
      this.selectedDomain === undefined ||
      this.selectedDomain.labelhash in this.qrCodes === false
    ) {
      this.qrLinks[this.selectedDomain.labelhash] = qrLink;
      return;
    }
    this.qrLinks[this.selectedDomain.labelhash] = qrLink;
    this.save();
  }

  detectQrLink() {
    if (
      this.selectedDomain === undefined ||
      this.qrLinks === undefined ||
      this.qrLinks === null
    ) {
      return '';
    }
    const domain = this.selectedDomain.labelhash;
    if (domain in this.qrLinks === false) {
      return '';
    }
    this.qrCodes[domain] = true;
    if (this.qrLinks[domain].indexOf('opensea') > -1) {
      return 'opensea';
    }
    if (this.qrLinks[domain].indexOf('looksrare') > -1) {
      return 'looksrare';
    }
    return 'custom';
  }

  toggleQrCode(setAll: boolean = false, isTrue: boolean = false) {
    if (this.selectedDomain === undefined) {
      return;
    }
    this.displayImageLoaded = false;
    if (setAll === true) {
      this.domains.map((d) => {
        this.qrCodes[d.labelhash] = isTrue;
        if (isTrue === false) {
          this.qrLinks = {};
        }
      });
    } else {
      if (this.selectedDomain.labelhash in this.qrCodes === false) {
        this.qrCodes[this.selectedDomain.labelhash] = true;
        this.qrLinks[this.selectedDomain.labelhash] =
          qrLinkEnums.OPENSEA +
          this.canvasServices.getDomainTokenId(this.selectedDomain.labelhash);
        this.qrColors[this.selectedDomain.labelhash] = this.currentQrColor;
      } else if (this.qrCodes[this.selectedDomain.labelhash] === false) {
        this.qrCodes[this.selectedDomain.labelhash] = true;
      } else {
        this.qrCodes[this.selectedDomain.labelhash] = false;
        delete this.qrLinks[this.selectedDomain.labelhash];
        delete this.qrCodes[this.selectedDomain.labelhash];
        delete this.qrColors[this.selectedDomain.labelhash];
      }
    }
    this.save();
    document.getElementById('canvas_ht').innerHTML = '';
    document.getElementById('canvas_image_displayed').innerHTML = '';
    this.drawSelectedImageCanvas();
    this.showImages();
  }

  isQrCodeEnabled() {
    if (
      this.selectedDomain === undefined ||
      this.selectedDomain.labelhash in this.qrCodes === false
    ) {
      return false;
    }
    return this.qrCodes[this.selectedDomain.labelhash];
  }

  getQrLink(domain: any = false) {
    const domainSet = domain !== false ? domain : this.selectedDomain;
    if (
      domainSet === undefined ||
      domainSet.labelhash in this.qrLinks === false
    ) {
      return domainSet.labelName;
    }
    return this.qrLinks[domainSet.labelhash];
  }

  selectDomain(selected: any) {
    this.displayImageLoaded = false;
    this.selectedDomain = selected;
    this.drawSelectedImageCanvas();
  }

  getDomainPriceColor(domainHash: string) {
    return domainHash in this.priceColors
      ? this.priceColors[domainHash]
      : '#ffffff';
  }

  isPriceAvailableForDomain(domainHash: string) {
    return domainHash in this.prices;
  }

  triggerFilterCheck() {
    this.detector.markForCheck();
  }

  goToHome() {
    this.pagesFacadeService.gotoPageRoute('home', PagesEnum.HOME);
  }

  get userData() {
    return this.userFacadeService.userState$.pipe(
      switchMap((s) => {
        if ('walletAddress' in s.user && s.user.walletAddress !== undefined) {
          this.currentUserData = s.user;
          return of(s.user.walletAddress);
        }
        return of(false);
      })
    );
  }

  get ipfsState() {
    return this.pagesFacadeService.pagesIpfsState$;
  }
}
