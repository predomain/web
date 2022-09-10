import { ens_normalize, ens_tokenize } from '@adraffy/ens-normalize';
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
import { ContractService } from '../contract';
import { EnsService } from '../ens';
import { MiscUtilsService } from '../misc-utils';
import { PaymentService } from '../payment';

const gloalAny: any = global;

@Injectable({
  providedIn: 'root',
})
export class RegistrationFacilityService {
  constructor(
    protected miscUtilsService: MiscUtilsService,
    protected paymentService: PaymentService,
    protected ensService: EnsService,
    protected contractService: ContractService
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
    payer: string,
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
          return this.contractService
            .getGasLimitEstimation(
              provider,
              'requestRegistration',
              [commitmentResult[0]],
              payer,
              this.bulkRegistrationContractAddress,
              this.BulkRegistrationContractABI
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
          gasLimit = r as BigNumber;
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
    payer: string,
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
      namesLengths.push(this.ensService.getNameLength(c.name));
    }
    const dataMethod =
      commitments[0].resolver === payNoMarketAddress
        ? 'completeRegistration'
        : 'completeRegistrationWithConfigs';
    const dataParams =
      commitments[0].resolver === payNoMarketAddress
        ? [names, namesLengths, owner, duration, secret]
        : [names, namesLengths, duration, secret, resolver, owner];
    const dataInput = contract.interface.encodeFunctionData(
      dataMethod,
      dataParams
    );
    let gasLimit;
    if (names.length === 1) {
      return of([
        dataInput,
        ethers.BigNumber.from(
          commitments[0].resolver === payNoMarketAddress ? '250000' : '350000'
        ),
      ]);
    }
    return new Observable((observer) => {
      this.contractService
        .getGasLimitEstimation(
          provider,
          dataMethod,
          dataParams,
          payer,
          this.bulkRegistrationContractAddress,
          this.BulkRegistrationContractABI,
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

  getEnsBulkRegistrationContract(provider = null) {
    const c = new Contract(
      this.bulkRegistrationContractAddress,
      this.BulkRegistrationContractABI,
      provider
    );
    return c;
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
