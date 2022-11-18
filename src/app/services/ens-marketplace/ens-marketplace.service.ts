import { Injectable } from '@angular/core';
import { BigNumber, Contract } from 'ethers';
import { from, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  ENSContracts,
  ENSResolverABI,
  ENSReverseRegisteryABI,
  ENSTokenNFTABI,
  generalConfigurations,
  marketplaceMainnet,
  marketplaceTestnet,
} from 'src/app/configurations';
import { ENSMarketplaceMainnetABI } from 'src/app/configurations/contracts/ens-marketplace-abi-mainnet.model';
import { ENSMarketplaceTestnetABI } from 'src/app/configurations/contracts/ens-marketplace-abi-testnet.model';
import { environment } from 'src/environments/environment';
import { ContractService } from '../contract';
import { EnsService } from '../ens/ens.service';

const globalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class EnsMarketplaceService {
  constructor(
    protected contractService: ContractService,
    protected ensService: EnsService
  ) {}

  checkApproval(tokenId: string, provider) {
    const contract = this.getENSTokenContract(provider);
    return from(contract.ownerOf(tokenId)).pipe(
      switchMap((r) => {
        if (r === null) {
          throw null;
        }
        return contract.isApprovedForAll(r, this.marketplaceContractAddress);
      }),
      switchMap((r) => {
        if (r === null) {
          throw null;
        }
        return of(r);
      }),
      catchError((e) => {
        return of(null);
      })
    );
  }

  transfer(domainNames: string[], to: string, payer: string, provider: any) {
    const contract = this.getENSMarketplaceContract(provider);
    const dataMethod = 'transferDomains';
    const dataParams = [to, domainNames];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          this.marketplaceContractAddress,
          this.marketplaceContractABI,
          false
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = r as BigNumber;
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  approve(
    operator: string,
    payer: string,
    approvalStatus: boolean,
    provider: any
  ) {
    const contract = this.getENSTokenContract(provider);
    const dataMethod = 'setApprovalForAll';
    const dataParams = [operator, approvalStatus];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          ENSContracts.token,
          ENSTokenNFTABI,
          false
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = r as BigNumber;
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  renew(
    domainNames: string[],
    priceRanges: string[],
    duration: BigNumber,
    payer: string,
    totalCost: string,
    provider: any
  ) {
    const contract = this.getENSMarketplaceContract(provider);
    const namesLengths = [];
    for (const c of domainNames) {
      namesLengths.push(this.ensService.getNameLength(c));
    }
    const dataMethod = 'renewDomains';
    const dataParams = [domainNames, namesLengths, priceRanges, duration];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          this.marketplaceContractAddress,
          this.marketplaceContractABI,
          false,
          totalCost
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = (r as BigNumber).add(generalConfigurations.gasLimitBuffer);
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  setContentHash(
    name: string,
    hash: string,
    resolverAddress: string,
    payer: string,
    provider: any
  ) {
    const contract = this.getENSResolverContract(resolverAddress, provider);
    const dataMethod = 'setContenthash';
    const dataParams = [name, hash];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          resolverAddress,
          ENSResolverABI,
          false
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = (r as BigNumber).add(generalConfigurations.gasLimitBuffer);
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  setText(
    name: string,
    key: string,
    value: string,
    resolverAddress: string,
    payer: string,
    provider: any
  ) {
    const contract = this.getENSResolverContract(resolverAddress, provider);
    const dataMethod = 'setText';
    const dataParams = [name, key, value];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          resolverAddress,
          ENSResolverABI,
          false
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = (r as BigNumber).add(generalConfigurations.gasLimitBuffer);
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  setProfileName(name: string, payer: string, provider: any) {
    const contract = this.getENSReverseRegistryContract(provider);
    const dataMethod = 'setName';
    const dataParams = [name];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          this.ensReverseRegistryContractAddress,
          ENSReverseRegisteryABI,
          false
        )
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit = (r as BigNumber).add(generalConfigurations.gasLimitBuffer);
          observer.next([dataInput, gasLimit]);
          observer.complete();
          return;
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getENSTokenContract(provider) {
    const contract = new Contract(ENSContracts.token, ENSTokenNFTABI, provider);
    return contract;
  }

  getENSResolverContract(resolver, provider) {
    const contract = new Contract(resolver, ENSResolverABI, provider);
    return contract;
  }

  getENSMarketplaceContract(provider) {
    const contract = new Contract(
      this.marketplaceContractAddress,
      this.marketplaceContractABI,
      provider
    );
    return contract;
  }

  getENSReverseRegistryContract(provider) {
    const contract = new Contract(
      this.ensReverseRegistryContractAddress,
      ENSReverseRegisteryABI,
      provider
    );
    return contract;
  }

  get ensReverseRegistryContractAddress() {
    if (environment.test === true) {
      return ENSContracts.reverseRegistryTestnet;
    }
    return ENSContracts.reverseRegistry;
  }

  get marketplaceContractAddress() {
    if (environment.test === true) {
      return marketplaceTestnet;
    }
    return marketplaceMainnet;
  }

  get marketplaceContractABI() {
    if (environment.test === true) {
      return ENSMarketplaceTestnetABI;
    }
    return ENSMarketplaceMainnetABI;
  }
}
