import React from 'react';
import {
  Check,
  X,
  ShoppingBag,
  CircleCheck,
  Package,
  Truck,
  MapPin,
} from 'lucide-react';

/**
 * 5 visible steps mapped from the full OrderStatus lifecycle.
 *
 * Intermediate statuses produce partial connector progress:
 *   ready_for_pickup  → connector between Packed ↔ Shipped is half-filled
 *   out_for_delivery  → connector between Shipped ↔ Delivered is half-filled
 */

type StepDef = {
  label: string;
  icon: React.ElementType;
  /** OrderStatus values that count as "this step reached" */
  statuses: string[];
};

const STEPS: StepDef[] = [
  { label: 'Order Placed', icon: ShoppingBag, statuses: ['placed'] },
  { label: 'Confirmed', icon: CircleCheck, statuses: ['confirmed'] },
  { label: 'Packed', icon: Package, statuses: ['packed'] },
  { label: 'Shipped', icon: Truck, statuses: ['ready_for_pickup', 'shipped'] },
  { label: 'Delivered', icon: MapPin, statuses: ['out_for_delivery', 'delivered'] },
];

/** Flat ordering used to compute which step the current status falls into. */
const STATUS_ORDER: string[] = [
  'placed',
  'confirmed',
  'packed',
  'ready_for_pickup',
  'shipped',
  'out_for_delivery',
  'delivered',
];

/**
 * Returns:
 *  - resolvedStepIndex: the visible-step index (0-4) the current status belongs to
 *  - isIntermediate: true when the status is the first entry of a multi-status step
 *    (i.e. ready_for_pickup or out_for_delivery), meaning the connector leading INTO
 *    this step should show partial (50%) progress.
 */
function resolveStatus(currentStatus: string) {
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    // We don't know how far the order got before cancellation — show step 0 only.
    return { resolvedStepIndex: -1, isIntermediate: false, isCancelled: true };
  }

  const flatIdx = STATUS_ORDER.indexOf(currentStatus);
  if (flatIdx === -1) {
    return { resolvedStepIndex: -1, isIntermediate: false, isCancelled: false };
  }

  let stepIndex = -1;
  let isIntermediate = false;

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    const posInStep = step.statuses.indexOf(currentStatus);
    if (posInStep !== -1) {
      stepIndex = i;
      // If the status is the first of multiple statuses in a step, it's intermediate
      isIntermediate = step.statuses.length > 1 && posInStep === 0;
      break;
    }
  }

  return { resolvedStepIndex: stepIndex, isIntermediate, isCancelled: false };
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
  const { resolvedStepIndex, isIntermediate, isCancelled } =
    resolveStatus(currentStatus);

  const getStepState = (idx: number): StepState => {
    if (isCancelled) {
      // Show first step (Order Placed) as cancelled, rest future
      return idx === 0 ? 'cancelled' : 'future';
    }

    if (idx < resolvedStepIndex) return 'completed';
    if (idx === resolvedStepIndex) {
      // If the order is fully delivered, that step is "completed" not "current"
      if (currentStatus === 'delivered') return 'completed';
      return 'current';
    }
    return 'future';
  };

  const getConnectorFill = (afterStepIdx: number): ConnectorFill => {
    if (isCancelled) return 'none';

    const nextStepIdx = afterStepIdx + 1;

    // The connector AFTER step `afterStepIdx` leads into step `nextStepIdx`.
    if (nextStepIdx < resolvedStepIndex) return 'full';
    if (nextStepIdx > resolvedStepIndex) return 'none';

    // nextStepIdx === resolvedStepIndex
    // If current status is intermediate (first of multi-status in the step),
    // show partial fill on the connector leading into this step.
    if (isIntermediate) return 'half';
    return 'full';
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 overflow-hidden">
      {/* Desktop: horizontal row | Mobile: vertical column */}
      <div className="flex flex-col md:flex-row md:items-start gap-0">
        {STEPS.map((step, idx) => {
          const state = getStepState(idx);
          const isLast = idx === STEPS.length - 1;

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
                    {state === 'cancelled' ? 'Cancelled' : step.label}
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
    </div>
  );
};
