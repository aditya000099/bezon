import React from 'react';
import {
  Check,
  X,
  ShoppingBag,
  CircleCheck,
  Package,
  Truck,
  MapPin,
  ClipboardList,
  ThumbsUp,
  Warehouse,
  Banknote,
  RefreshCw,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';

type StepDef = {
  label: string;
  icon: React.ElementType;
  /** OrderStatus values that count as "this step reached" */
  statuses: string[];
};

const STEPS_STANDARD: StepDef[] = [
  { label: 'Order Placed', icon: ShoppingBag, statuses: ['placed'] },
  { label: 'Confirmed', icon: CircleCheck, statuses: ['confirmed'] },
  { label: 'Packed', icon: Package, statuses: ['packed'] },
  { label: 'Shipped', icon: Truck, statuses: ['ready_for_pickup', 'shipped'] },
  { label: 'Delivered', icon: MapPin, statuses: ['out_for_delivery', 'delivered'] },
];

const STEPS_RETURN: StepDef[] = [
  { label: 'Delivered', icon: MapPin, statuses: ['delivered'] },
  { label: 'Return Requested', icon: ClipboardList, statuses: ['return_requested', 'return_rejected'] },
  { label: 'Approved', icon: ThumbsUp, statuses: ['return_approved'] },
  { label: 'Item Received', icon: Warehouse, statuses: ['returned_to_origin'] },
];

const STEPS_REFUND: StepDef[] = [
  { label: 'Delivered', icon: MapPin, statuses: ['delivered', 'returned_to_origin'] },
  { label: 'Refund Requested', icon: ClipboardList, statuses: ['refund_requested', 'refund_rejected'] },
  { label: 'Approved', icon: ThumbsUp, statuses: ['refund_approved', 'refunding'] },
  { label: 'Refunded', icon: Banknote, statuses: ['refunded'] },
];

const STEPS_REPLACE: StepDef[] = [
  { label: 'Delivered', icon: MapPin, statuses: ['delivered', 'returned_to_origin'] },
  { label: 'Replace Requested', icon: ClipboardList, statuses: ['replacement_requested', 'replacement_rejected'] },
  { label: 'Approved', icon: ThumbsUp, statuses: ['replacement_approved'] },
  { label: 'Repl. Shipped', icon: Truck, statuses: ['replacement_shipped'] },
  { label: 'Replaced', icon: HeartHandshake, statuses: ['replaced'] },
];

const STATUS_ORDER_STANDARD = [
  'placed',
  'confirmed',
  'packed',
  'ready_for_pickup',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const STATUS_ORDER_RETURN = [
  'delivered',
  'return_requested',
  'return_approved',
  'returned_to_origin',
];

const STATUS_ORDER_REFUND = [
  'delivered',
  'refund_requested',
  'refund_approved',
  'refunding',
  'refunded',
];

const STATUS_ORDER_REPLACE = [
  'delivered',
  'replacement_requested',
  'replacement_approved',
  'replacement_shipped',
  'replaced',
];

export function getFlowConfig(currentStatus: string) {
  if (['return_requested', 'return_approved', 'returned_to_origin', 'return_rejected'].includes(currentStatus)) {
    return {
      steps: STEPS_RETURN,
      statusOrder: STATUS_ORDER_RETURN,
      title: 'Return Tracker',
      flowName: 'return'
    };
  }
  if (['refund_requested', 'refund_approved', 'refunding', 'refunded', 'refund_rejected'].includes(currentStatus)) {
    return {
      steps: STEPS_REFUND,
      statusOrder: STATUS_ORDER_REFUND,
      title: 'Refund Tracker',
      flowName: 'refund'
    };
  }
  if (['replacement_requested', 'replacement_approved', 'replacement_shipped', 'replaced', 'replacement_rejected'].includes(currentStatus)) {
    return {
      steps: STEPS_REPLACE,
      statusOrder: STATUS_ORDER_REPLACE,
      title: 'Replacement Tracker',
      flowName: 'replace'
    };
  }
  return {
    steps: STEPS_STANDARD,
    statusOrder: STATUS_ORDER_STANDARD,
    title: 'Order Tracker',
    flowName: 'standard'
  };
}

function resolveStatus(currentStatus: string, steps: StepDef[], statusOrder: string[]) {
  const isCancelled = currentStatus === 'cancelled';
  const isRejected = ['return_rejected', 'refund_rejected', 'replacement_rejected'].includes(currentStatus);

  if (isCancelled) {
    return { resolvedStepIndex: -1, isIntermediate: false, isCancelled: true, isRejected: false };
  }

  let mappedStatus = currentStatus;
  if (currentStatus === 'return_rejected') mappedStatus = 'return_requested';
  if (currentStatus === 'refund_rejected') mappedStatus = 'refund_requested';
  if (currentStatus === 'replacement_rejected') mappedStatus = 'replacement_requested';

  const flatIdx = statusOrder.indexOf(mappedStatus);
  if (flatIdx === -1) {
    return { resolvedStepIndex: 0, isIntermediate: false, isCancelled: false, isRejected };
  }

  let stepIndex = -1;
  let isIntermediate = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const posInStep = step.statuses.indexOf(mappedStatus);
    if (posInStep !== -1) {
      stepIndex = i;
      isIntermediate = step.statuses.length > 1 && posInStep === 0;
      break;
    }
  }

  return { resolvedStepIndex: stepIndex, isIntermediate, isCancelled: false, isRejected };
}

/* ─── Connector ───────────────────────────────────────────────── */

type ConnectorFill = 'full' | 'half' | 'none';

const Connector: React.FC<{ fill: ConnectorFill }> = ({ fill }) => {
  const bg = fill === 'none' ? 'bg-slate-200' : 'bg-slate-200';
  const fgWidth =
    fill === 'full' ? 'w-full' : fill === 'half' ? 'w-1/2' : 'w-0';
  const fgHeight =
    fill === 'full' ? 'h-full' : fill === 'half' ? 'h-1/2' : 'h-0';

  return (
    <>
      {/* Desktop: horizontal connector */}
      <div
        className={`hidden md:flex flex-1 items-center self-start mt-[18px]`}
      >
        <div className={`${bg} h-[3px] w-full rounded-full overflow-hidden`}>
          <div
            className={`h-full bg-emerald-500 ${fgWidth} transition-all duration-700 ease-out`}
          />
        </div>
      </div>

      {/* Mobile: vertical connector */}
      <div className="flex md:hidden justify-start ml-[17px]">
        <div className={`${bg} w-[3px] h-8 rounded-full overflow-hidden`}>
          <div
            className={`w-full bg-emerald-500 ${fgHeight} transition-all duration-700 ease-out`}
          />
        </div>
      </div>
    </>
  );
};

/* ─── Step Circle ─────────────────────────────────────────────── */

type StepState = 'completed' | 'current' | 'future' | 'cancelled';

const StepCircle: React.FC<{
  state: StepState;
  stepIndex: number;
  Icon: React.ElementType;
}> = ({ state, stepIndex, Icon }) => {
  if (state === 'completed') {
    return (
      <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
        <Check className="h-5 w-5 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (state === 'cancelled') {
    return (
      <div className="h-9 w-9 rounded-full bg-rose-600 flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
        <X className="h-5 w-5 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (state === 'current') {
    return (
      <div className="relative flex items-center justify-center shrink-0">
        {/* Pulse ring */}
        <span className="absolute h-11 w-11 rounded-full bg-indigo-400/30 animate-ping" />
        <span className="absolute h-11 w-11 rounded-full bg-indigo-100 animate-pulse" />
        <div className="relative h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  // future
  return (
    <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 text-sm font-bold shrink-0">
      {stepIndex + 1}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────── */

export const OrderTrackingStepper: React.FC<{ currentStatus: string }> = ({
  currentStatus,
}) => {
  const { steps, statusOrder, title, flowName } = getFlowConfig(currentStatus);
  const { resolvedStepIndex, isIntermediate, isCancelled, isRejected } =
    resolveStatus(currentStatus, steps, statusOrder);

  const getStepState = (idx: number): StepState => {
    if (isCancelled) {
      return idx === 0 ? 'cancelled' : 'future';
    }

    if (isRejected && idx === resolvedStepIndex) {
      return 'cancelled';
    }

    if (idx < resolvedStepIndex) return 'completed';
    if (idx === resolvedStepIndex) {
      const finalStatuses = ['delivered', 'refunded', 'replaced'];
      if (finalStatuses.includes(currentStatus)) return 'completed';
      return 'current';
    }
    return 'future';
  };

  const getConnectorFill = (afterStepIdx: number): ConnectorFill => {
    if (isCancelled || isRejected) return 'none';

    const nextStepIdx = afterStepIdx + 1;

    if (nextStepIdx < resolvedStepIndex) return 'full';
    if (nextStepIdx > resolvedStepIndex) return 'none';

    if (isIntermediate) return 'half';
    return 'full';
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 overflow-hidden">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        {title}
      </div>
      {/* Desktop: horizontal row | Mobile: vertical column */}
      <div className="flex flex-col md:flex-row md:items-start gap-0">
        {steps.map((step, idx) => {
          const state = getStepState(idx);
          const isLast = idx === steps.length - 1;

          let labelText = step.label;
          if (isRejected && idx === resolvedStepIndex) {
            labelText = 'Rejected';
          }

          return (
            <React.Fragment key={step.label}>
              {/* Step node */}
              <div className="flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-2 md:min-w-[80px]">
                <StepCircle
                  state={state}
                  stepIndex={idx}
                  Icon={step.icon}
                />
                <div className="flex flex-col md:items-center">
                  <span
                    className={`text-sm md:text-xs font-semibold leading-tight ${
                      state === 'completed'
                        ? 'text-emerald-700'
                        : state === 'current'
                          ? 'text-indigo-700'
                          : state === 'cancelled'
                            ? 'text-rose-700'
                            : 'text-slate-400'
                    }`}
                  >
                    {state === 'cancelled' ? labelText : step.label}
                  </span>
                  {state === 'current' && (
                    <span className="text-[10px] text-indigo-400 font-medium mt-0.5">
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Connector line (skip after last step) */}
              {!isLast && <Connector fill={getConnectorFill(idx)} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="mt-5 flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <X className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-rose-900">
              This order has been cancelled.
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              Any authorization hold or payment captured is refunded
              automatically.
            </p>
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {isRejected && (
        <div className="mt-5 flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-rose-900">
              Your {flowName} request was rejected by the merchant.
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              Please check the status logs or contact support for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
