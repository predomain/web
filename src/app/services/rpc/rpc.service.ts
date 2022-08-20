import { Injectable } from '@angular/core';
import { RPCProviderModel } from 'src/app/models/rpc/rpc-provider.model';

@Injectable({
  providedIn: 'root',
})
export class RpcService {
  constructor() {}

  loadRpc() {
    return localStorage.getItem('canvas-rpc');
  }

  saveRpc(rpcData: RPCProviderModel) {
    localStorage.setItem('canvas-rpc', JSON.stringify(rpcData));
  }

  removeRPC() {
    localStorage.removeItem('canvas-rpc');
  }
}
