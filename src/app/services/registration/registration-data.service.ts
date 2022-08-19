import { Injectable } from '@angular/core';
import { Contract, ethers } from 'ethers';
import { ENSContracts } from 'src/app/configurations';
import { EnsTestnetABI } from 'src/app/configurations/contracts/ens-abi-testnet.model';
import { EnsABI } from 'src/app/configurations/contracts/ens-abi.model';
import { EnsRegistrarControllerTestnetABI } from 'src/app/configurations/contracts/ens-registrar-controller-abi-testnet.model';
import { EnsRegistrarControllerABI } from 'src/app/configurations/contracts/ens-registrar-controller-abi.model';
import { payNoMarketAddress } from 'src/app/models';
import { ENSEventModel, EnsEventsEnum } from 'src/app/models/ens';
import { environment } from 'src/environments/environment';

export const registrationTopic =
  '0xca6abbe9d7f11422cb6ca7629fbf6fe9efb1c621f71ce8f02b9f2a230097404f';
export const nameRenewedTopicHash =
  '0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae';
export const martketSaleTopics = {
  SEAPORT: '0xc4109843e0b7d514e4c093114b863f8e7d8d9a458c372cd51bfe526b588006c9',
  RARIBLE: '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31',
  X2Y2: '0xe2c49856b032c255ae7e325d18109bc4e22a2804e2e49a017ec0f59f19cd447b',
  LOOKSRARE:
    '0x95fb6205e23ff6bda16a2d1dba56b9ad7c783f67c96fa149785052f47696f2be',
};
export enum SortableMarkets {
  SEAPORT = 'SEAPORT',
  RARIBLE = 'RARIBLE',
  X2Y2 = 'X2Y2',
  LOOKSRARE = 'LOOKSrare',
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationDataService {
  constructor() {}

  resolevTxType(relatedNameLabelHash: string, owner: string, tx: any) {
    const marketTopics = Object.values(martketSaleTopics);
    const markets = Object.keys(martketSaleTopics);
    let qualifiedTx = tx.logs.filter((e) => {
      if (marketTopics.filter((t) => e.topics.includes(t)).length > 0) {
        return true;
      }
      if (
        e.topics.includes(owner) ||
        e.topics.includes(relatedNameLabelHash) ||
        e.topics.includes(ENSContracts.registrarController)
      ) {
        return true;
      }
      return false;
    });
    let resolvedEventType: ENSEventModel[] = [];
    const labelHashInHex =
      ethers.BigNumber.from(relatedNameLabelHash).toHexString();
    const paymentNoAddressBytes =
      ethers.BigNumber.from(payNoMarketAddress).toHexString();
    for (const e of qualifiedTx) {
      const topicNormalised = e.topics.map((x) => {
        return ethers.BigNumber.from(x).toHexString();
      });
      if (marketTopics.includes(topicNormalised[0])) {
        const whichMarket = markets[marketTopics.indexOf(topicNormalised[0])];
        const marketBuyer = this.getMarketBuyer(
          SortableMarkets[whichMarket],
          e,
          topicNormalised,
          tx
        );
        const marketSeller = this.getMarketSeller(
          SortableMarkets[whichMarket],
          e,
          topicNormalised,
          tx
        );
        resolvedEventType.push({
          type: EnsEventsEnum.SALE,
          from: marketSeller.toLowerCase(),
          to: marketBuyer.toLowerCase(),
          txHash: tx.transactionHash,
          value: this.txValueToEther(tx.value),
          date: tx.timestamp,
        } as ENSEventModel);
      } else if (
        (topicNormalised[1] ===
          ENSContracts.registrarController.toLowerCase() &&
          topicNormalised[2] !== paymentNoAddressBytes) ||
        (topicNormalised[0] === registrationTopic &&
          topicNormalised[1] === labelHashInHex &&
          topicNormalised[2] === owner)
      ) {
        const registrant = topicNormalised[2];
        resolvedEventType.push({
          type: EnsEventsEnum.REGISTRATION,
          from: ENSContracts.registrarController.toLowerCase(),
          to: registrant.toLowerCase(),
          txHash: tx.transactionHash,
          value: this.txValueToEther(tx.value),
          date: tx.timestamp,
        } as ENSEventModel);
      } else if (
        (topicNormalised[1] === paymentNoAddressBytes &&
          topicNormalised[2] ===
            ENSContracts.registrarController.toLowerCase()) ||
        (topicNormalised[1] === paymentNoAddressBytes &&
          topicNormalised[2] === owner)
      ) {
        resolvedEventType.push({
          type: EnsEventsEnum.MINT,
          from: null,
          to: ENSContracts.registrarController.toLowerCase(),
          txHash: tx.transactionHash,
          value: this.txValueToEther(tx.value),
          date: tx.timestamp,
        } as ENSEventModel);
      } else if (topicNormalised[2] === paymentNoAddressBytes) {
        resolvedEventType.push({
          type: EnsEventsEnum.BURN,
          from: topicNormalised[1],
          to: null,
          txHash: tx.transactionHash,
          value: this.txValueToEther(tx.value),
          date: tx.timestamp,
        } as ENSEventModel);
      } else if (
        topicNormalised[1] !== ENSContracts.registrarController.toLowerCase() &&
        topicNormalised[1] !== paymentNoAddressBytes &&
        topicNormalised[2] !== ENSContracts.registrarController.toLowerCase() &&
        topicNormalised[2] !== paymentNoAddressBytes &&
        topicNormalised[1].length === 42 &&
        topicNormalised[2].length === 42
      ) {
        resolvedEventType.push({
          type: EnsEventsEnum.TRANSFER,
          from: topicNormalised[1].toLowerCase(),
          to: topicNormalised[2].toLowerCase(),
          txHash: tx.transactionHash,
          value: this.txValueToEther(tx.value),
          date: tx.timestamp,
        } as ENSEventModel);
      }
    }
    const uniqueSet = new Set();
    let filteredEvents = resolvedEventType;
    if (resolvedEventType.map((re) => re.type).includes(EnsEventsEnum.SALE)) {
      filteredEvents = resolvedEventType.filter((r) => {
        if (r.type === EnsEventsEnum.SALE) {
          return true;
        }
        return false;
      });
    }
    return filteredEvents.filter((r) => {
      const isDuplicate = uniqueSet.has(r.type + r.txHash);
      uniqueSet.add(r.type + r.txHash);
      if (isDuplicate === false) {
        return true;
      }
      return false;
    });
  }

  txValueToEther(value: string) {
    return parseFloat(
      ethers.utils.formatEther(ethers.BigNumber.from(value).toString())
    ).toFixed(5);
  }

  getMarketBuyer(
    market: SortableMarkets,
    eventWholeData: any,
    event: any,
    tx: any
  ) {
    switch (market) {
      case SortableMarkets.SEAPORT:
        {
          return event[2];
        }
        break;
      case SortableMarkets.LOOKSRARE:
        {
          return tx.from;
        }
        break;
      case SortableMarkets.RARIBLE:
        {
          return tx.from;
        }
        break;
      case SortableMarkets.X2Y2:
        {
          return tx.from;
        }
        break;
    }
  }

  getMarketSeller(
    market: SortableMarkets,
    eventWholeData: any,
    event: any,
    tx: any
  ) {
    switch (market) {
      case SortableMarkets.SEAPORT:
        {
          return event[1];
        }
        break;
      case SortableMarkets.LOOKSRARE:
        {
          return event[2];
        }
        break;
      case SortableMarkets.RARIBLE:
        {
          return event[1];
        }
        break;
      case SortableMarkets.X2Y2:
        {
          const data = eventWholeData.data.substring(2).match(/.{1,64}/g);
          return ethers.BigNumber.from('0x' + data[2]).toHexString();
        }
        break;
    }
  }

  getENSContract(provider) {
    const contract = new Contract(
      ENSContracts.registrar,
      this.ensContractABI,
      provider
    );
    return contract;
  }

  getENSRegistrarControllerContract(provider) {
    const contract = new Contract(
      ENSContracts.registrarController,
      this.ensRegistrarControllerContractABI,
      provider
    );
    return contract;
  }

  get ensRegistrarControllerContractABI() {
    if (environment.test === true) {
      return EnsRegistrarControllerTestnetABI;
    }
    return EnsRegistrarControllerABI;
  }

  get ensContractABI() {
    if (environment.test === true) {
      return EnsTestnetABI;
    }
    return EnsABI;
  }
}
