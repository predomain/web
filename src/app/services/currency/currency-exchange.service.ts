import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, timer } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { generalConfigurations, priceOracles } from 'src/app/configurations';
import {
  MarketPriceModel,
  MarketPricesBinanceModel,
  MarketPricesHuobiModel,
} from 'src/app/models/markets';
import { PaymentFacadeService } from 'src/app/store/facades';

enum MarketPriceTypes {
  BINANCE,
  HUOBI,
}

@Injectable({
  providedIn: 'root',
})
export class CurrencyExchangeService {
  marketPricesAPIEndpoints = priceOracles;

  constructor(
    protected http: HttpClient,
    protected paymentFacade: PaymentFacadeService
  ) {}

  getPrices() {
    let processorLocked = false;
    return timer(0, generalConfigurations.timeToUpdateCheckoutPipe).pipe(
      filter((i) => {
        if (processorLocked === true) {
          return false;
        }
        return true;
      }),
      switchMap((i) => {
        processorLocked = true;
        return of(i).pipe(
          switchMap((ii) => {
            return this.getPricesBinance().pipe(
              map((r) => {
                return r;
              })
            );
          }),
          switchMap((binancePrice) => {
            return this.getPricesHuobi().pipe(
              map((r) => {
                return [binancePrice, r];
              })
            );
          }),
          switchMap((allPrices) => {
            const [binancePrice, huobiPrice] = allPrices;
            if (binancePrice === false && huobiPrice === false) {
              throw 1;
            }
            if (binancePrice !== false) {
              return of([binancePrice, MarketPriceTypes.BINANCE]);
            }
            if (huobiPrice !== false) {
              return of([huobiPrice, MarketPriceTypes.HUOBI]);
            }
          }),
          map((selectedPricesAndMarket) => {
            const [prices, marketType] = selectedPricesAndMarket;
            let cryptoPrices;
            if (marketType === MarketPriceTypes.BINANCE) {
              cryptoPrices = this.normalizePricesBinance(prices);
            }
            if (marketType === MarketPriceTypes.HUOBI) {
              cryptoPrices = this.normalizePricesHuobi(prices);
            }
            return { ...cryptoPrices };
          }),
          map((normalizedPrices) => {
            this.paymentFacade.setEthUsdRate(normalizedPrices['ETHUSDT'].price);
            processorLocked = false;
          })
        );
      })
    );
  }
  getPricesHuobi() {
    return this.http.get(this.marketPricesAPIEndpoints.HUOBI).pipe(
      catchError((error) => {
        return of(false);
      })
    );
  }

  getPricesBinance() {
    return this.http.get(this.marketPricesAPIEndpoints.BINANCE).pipe(
      catchError((error) => {
        return of(false);
      })
    );
  }

  normalizePricesHuobi(prices: any) {
    const newPrices: {
      [ticker: string]: MarketPriceModel;
    } = {};
    if (prices === false) {
      return newPrices;
    }
    const pricesContained = prices as MarketPricesHuobiModel;
    for (const t of pricesContained.data) {
      newPrices[t.symbol] = {
        ticker: t.symbol.toUpperCase(),
        price: t.ask.toFixed(8),
      } as MarketPriceModel;
    }
    return newPrices;
  }

  normalizePricesBinance(prices: any) {
    const newPrices: {
      [ticker: string]: MarketPriceModel;
    } = {};
    if (prices === false) {
      return newPrices;
    }
    const pricesContained = prices as MarketPricesBinanceModel[];
    for (const t of pricesContained) {
      newPrices[t.symbol] = {
        ticker: t.symbol.toUpperCase(),
        price: parseFloat(t.price).toFixed(8),
      } as MarketPriceModel;
    }
    return newPrices;
  }
}
