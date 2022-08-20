import { Injectable } from '@angular/core';
import { BigNumber, Contract, ethers } from 'ethers';
import { Observable, of } from 'rxjs';
import {
  bulkRegistrationMainnet,
  bulkRegistrationTestnet,
  generalConfigurations,
} from 'src/app/configurations';
import { ENSBulkRegistrationContractMainnetABI } from 'src/app/configurations/contracts/ens-bulk-registration-mainnet.abi';
import { ENSBulkRegistrationContractTestnetABI } from 'src/app/configurations/contracts/ens-bulk-registration-testnet.abi';
import { payNoMarketAddress } from 'src/app/models';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import {
  ENSRegistrationCommitmentModel,
  ENSRegistrationCommmitmentRequestResultModel,
} from 'src/app/models/states/ens-registration-interfaces';
import { environment } from 'src/environments/environment';
import { MiscUtilsService } from '../misc-utils';
import { PaymentService } from '../payment';

const gloalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class RegistrationFacilityService {
  constructor(
    protected miscUtilsService: MiscUtilsService,
    protected paymentService: PaymentService
  ) {}

  registrationDomainsToCommitmentPacket(
    owner: string,
    duration: number,
    secret: string,
    resolver: string,
    commitments: ENSDomainMetadataModel[]
  ) {
    let compiled = [];
    for (const c of commitments) {
      const nc = {
        name: c.labelName,
        owner: owner,
        duration: BigNumber.from(duration),
        secret: secret,
        resolver: resolver,
        data: [],
        reverseRecord: resolver !== payNoMarketAddress ? true : false,
        fuses: 0,
        wrapperExpiry: 0,
        metadata: c,
      } as ENSRegistrationCommitmentModel;
      compiled.push(nc);
    }
    return compiled;
  }

  commitmentPacketToRegistrationDomains(
    commitments: ENSRegistrationCommitmentModel[]
  ) {
    let decompiled = [];
    for (const c of commitments) {
      const nc = c.metadata as ENSDomainMetadataModel;
      decompiled.push(nc);
    }
    return decompiled;
  }

  createRegistrationCommitmentPacket(
    commitments: ENSRegistrationCommitmentModel[],
    provider
  ) {
    const contract = this.getEnsBulkRegistrationContract(provider);
    const comitmentsPrepared = [];
    for (const c of commitments) {
      const nCP = [
        c.name,
        c.owner,
        c.duration,
        c.secret,
        c.resolver,
        c.data,
        c.reverseRecord,
        c.fuses,
        c.wrapperExpiry,
      ] as any;
      nCP.name = c.name;
      nCP.owner = c.owner;
      nCP.duration = c.duration;
      nCP.secret = c.secret;
      nCP.resolver = c.resolver;
      nCP.data = c.data;
      nCP.reverseRecord = c.reverseRecord;
      nCP.fuses = c.fuses;
      nCP.wrapperExpiry = c.wrapperExpiry;
      comitmentsPrepared.push(nCP);
    }
    const isResolverSet = comitmentsPrepared[0].resolver !== payNoMarketAddress;
    const duration = comitmentsPrepared[0].duration;
    let commitmentResult, gasLimit;
    return new Observable((observer) => {
      contract
        .createCommitmentsForRegistration(
          comitmentsPrepared,
          duration,
          isResolverSet
        )
        .then((r) => {
          commitmentResult = r;
          return this.getGasLimitEstimation(
            provider,
            'createCommitmentsForRegistration',
            [comitmentsPrepared, duration, isResolverSet]
          )
            .toPromise()
            .catch((e) => {
              return null;
            });
        })
        .then((r) => {
          if (
            r === false ||
            r === null ||
            commitmentResult === false ||
            commitmentResult === null
          ) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit =
            this.miscUtilsService.roundUp((r as BigNumber).toNumber(), 50000) +
            50000;
          observer.next([
            {
              commitments: commitmentResult[0],
              priceRanges: commitmentResult[1].map((pr) =>
                pr.mul(generalConfigurations.maxTotalCostBuffer).div(100)
              ),
            } as ENSRegistrationCommmitmentRequestResultModel,
            gasLimit,
          ]);
          observer.complete();
          return;
        });
    });
  }

  createRegistrationRequestPaymentPacket(
    commitmentsPrepared: string[],
    provider
  ) {
    const contract = this.getEnsBulkRegistrationContract(provider);
    const dataInput = contract.interface.encodeFunctionData(
      'requestRegistration',
      [commitmentsPrepared]
    );
    return dataInput;
  }

  decodeRegistrationPacket(abstractData: string, value: BigNumber) {
    const contract = this.getEnsBulkRegistrationContract();
    const dataInput = contract.interface.parseTransaction({
      data: abstractData,
      value,
    });
    return dataInput;
  }

  completeRegistration(
    commitments: ENSRegistrationCommitmentModel[],
    priceRanges: string[],
    totalCost: string,
    provider
  ) {
    const contract = this.getEnsBulkRegistrationContract(provider);
    const names = [];
    const namesLengths = [];
    const secret = commitments[0].secret;
    const resolver = commitments[0].resolver;
    const owner = commitments[0].owner;
    const duration = commitments[0].duration;
    for (const c of commitments) {
      names.push(c.name);
      namesLengths.push(c.name.length);
    }
    const dataMethod =
      commitments[0].resolver === payNoMarketAddress
        ? 'completeRegistration'
        : 'completeRegistrationWithConfigs';
    const dataParams =
      commitments[0].resolver === payNoMarketAddress
        ? [names, priceRanges, namesLengths, owner, duration, secret]
        : [names, priceRanges, namesLengths, duration, secret, resolver, owner];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    const preparedTx = {
      to: this.bulkRegistrationContractAddress,
      data: dataInput,
      value: totalCost,
    };
    return new Observable((observer) => {
      this.getGasLimitEstimation(provider, 'sendTransaction', preparedTx, true)
        .toPromise()
        .then((r) => {
          if (r === false || r === null) {
            observer.next(false);
            observer.complete();
            return;
          }
          gasLimit =
            this.miscUtilsService.roundUp((r as BigNumber).toNumber(), 50000) +
            50000;
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

  getEnsBulkRegistrationContract(provider = null) {
    const c = new Contract(
      this.bulkRegistrationContractAddress,
      this.BulkRegistrationContractABI,
      provider
    );
    return c;
  }

  getGasLimitEstimation(
    provider = null,
    method: string,
    params: any,
    providerFunction = false
  ) {
    const c = new Contract(
      this.bulkRegistrationContractAddress,
      this.BulkRegistrationContractABI,
      provider
    );
    return new Observable((observer) => {
      if (providerFunction === false) {
        c.estimateGas[method](...params)
          .then((r) => {
            if (r === null) {
              observer.next(false);
              observer.complete();
            }
            observer.next(r);
            observer.complete();
          })
          .catch((e) => {
            observer.next(false);
            observer.complete();
          });
      } else {
        provider
          .estimateGas(params)
          .then((r) => {
            if (r === null) {
              observer.next(false);
              observer.complete();
            }
            observer.next(r);
            observer.complete();
          })
          .catch((e) => {
            observer.next(false);
            observer.complete();
          });
      }
    });
  }

  get BulkRegistrationContractABI() {
    if (environment.test === true) {
      return ENSBulkRegistrationContractTestnetABI;
    }
    return ENSBulkRegistrationContractMainnetABI;
  }

  get bulkRegistrationContractAddress() {
    if (environment.test === true) {
      return bulkRegistrationTestnet;
    }
    return bulkRegistrationMainnet;
  }
}
