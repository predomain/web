import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { generalConfigurations } from '../../configurations';
import {
  PaymentModel,
  PaymentStateModel,
} from '../../models/states/payment-interfaces';
import {
  UpsertOnePayment,
  UpsertManyPayment,
  RemoveOnePayment,
  RemoveManyPayment,
  RemoveAllPayment,
  SetPaymentError,
  UpdatePayment,
  AddOnePayment,
  SetEthUSDRates,
  ArchiveAllPayment,
} from '../actions';

export function selectPaymentId(payment: PaymentModel): string {
  return payment.id;
}

export const adapter: EntityAdapter<PaymentModel> =
  createEntityAdapter<PaymentModel>({
    selectId: selectPaymentId,
  });

export const initialPaymentState: PaymentStateModel = adapter.getInitialState({
  error: undefined,
  loading: false,
  ethUsdPrice: '0.00',
});

export function PaymentReducers(
  state: PaymentStateModel = initialPaymentState,
  action: any
) {
  switch (action.type) {
    case UpsertOnePayment:
    case UpdatePayment: {
      const stateChange = adapter.upsertOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case SetEthUSDRates: {
      return {
        ...state,
        ethUsdPrice: action.payload,
      };
    }

    case AddOnePayment: {
      const stateChange = adapter.addOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: true,
      };
    }

    case UpsertManyPayment: {
      const stateChange = adapter.upsertMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveOnePayment: {
      const stateChange = adapter.removeOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveManyPayment: {
      const stateChange = adapter.removeMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveAllPayment: {
      const stateChange = adapter.removeAll(state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case ArchiveAllPayment: {
      const payments = state.entities;
      const updatedPayments = [];
      for (const p of Object.keys(payments)) {
        updatedPayments.push({ ...payments[p], archived: true });
      }
      const stateChange = adapter.upsertMany(updatedPayments, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case SetPaymentError: {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

    case UpdatePayment: {
      return {
        ...state,
        error: undefined,
        loading: true,
      };
    }

    default:
      return state;
  }
}
