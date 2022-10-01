import { Injectable } from '@angular/core';
import { Contract, ethers } from 'ethers';
import { forkJoin, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LNRContracts } from 'src/app/configurations';
import { LNRABI } from 'src/app/configurations/contracts/lnr.abi';
import { payNoMarketAddress } from 'src/app/models';
import { DomainMetadataModel } from 'src/app/models/domains';

const gloablAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class LnrService {
  constructor() {}

  findDomains(domains: string[]) {
    const provider = gloablAny.canvasProvider;
    const lnr = new Contract(LNRContracts.registrar, LNRABI, provider);
    const nameSearch = domains.map((d) => {
      const nameBytes = ethers.utils.formatBytes32String(d);
      return from(lnr.owner(nameBytes)).pipe(
        switchMap((r) => {
          if (r === false || r === payNoMarketAddress) {
            return of(false);
          }
          return of({
            id: nameBytes,
            labelName: d,
            labelHash: nameBytes,
            expiry: Number.MAX_SAFE_INTEGER.toString(),
            isNotAvailable: r !== payNoMarketAddress,
            gracePeriodPercent: 0,
            registrationDate: null,
            owner: r === payNoMarketAddress ? payNoMarketAddress : r,
            createdAt: null,
          } as DomainMetadataModel);
        })
      );
    });
    return forkJoin(nameSearch);
  }
}
