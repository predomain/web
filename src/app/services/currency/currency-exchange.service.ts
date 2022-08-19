import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { from, timer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import {
  contractChainlinkMainnet,
  contractChainlinkTestnet,
  generalConfigurations,
} from 'src/app/configurations';
import { chainlinkV3ABI } from 'src/app/configurations/contracts/chainlink-aggregator-v3.abi';
import { PaymentFacadeService } from 'src/app/store/facades';
import { environment } from 'src/environments/environment';

const globalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class CurrencyExchangeService {
  constructor(protected paymentFacade: PaymentFacadeService) {}

  getPrices() {
    let processorLocked = false;
    return timer(0, generalConfigurations.timeToUpdateEthUSDRate).pipe(
      filter((i) => {
        if (processorLocked === true) {
          return false;
        }
        return true;
      }),
      switchMap((i) => {
        processorLocked = true;
        return from(this.chainlink.latestRoundData()).pipe(
          map((normalizedPrices) => {
            if (normalizedPrices === false || normalizedPrices === null) {
              return false;
            }
            this.paymentFacade.setEthUsdRate(
              ((normalizedPrices as any).answer.toNumber() / 10 ** 8).toString()
            );
            processorLocked = false;
          })
        );
      })
    );
  }

  get chainlinkAddress() {
    if (environment.test === true) {
      return contractChainlinkTestnet;
    }
    return contractChainlinkMainnet;
  }

  get chainlink() {
    const contract = new Contract(
      this.chainlinkAddress,
      chainlinkV3ABI,
      globalAny.canvasProvider
    );
    return contract;
  }
}
