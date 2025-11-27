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
        PICK_UP: 'picked_up',
        UNASSIGN: 'pending',
      },
    },
    picked_up: {
      on: {
        START_DELIVERY: 'in_transit',
      },
    },
    in_transit: {
      on: {
        CONFIRM_DELIVERY: 'delivered',
        REPORT_ISSUE: 'failed',
      },
    },
    delivered: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY: 'assigned', // Or pending, depending on logic
      },
    },
  },
});
