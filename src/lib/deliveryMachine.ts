import { createMachine } from 'xstate';

export const deliveryMachine = createMachine({
  id: 'delivery',
  initial: 'pending',
  states: {
    pending: {
      on: {
        ASSIGN: 'assigned',
      },
    },
    assigned: {
      on: {
        CONFIRM_ARRIVAL_ORIGIN: 'loading',
        UNASSIGN: 'pending',
      },
    },
    loading: {
      on: {
        START_TRANSIT: 'in_transit',
      },
    },
    in_transit: {
      on: {
        CONFIRM_ARRIVAL_DESTINATION: 'unloading',
        REPORT_ISSUE: 'failed',
      },
    },
    unloading: {
      on: {
        CONFIRM_DELIVERY: 'delivered',
      },
    },
    delivered: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY: 'assigned',
      },
    },
  },
});
