import {
  Card,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bezon/ui';
import React from 'react';
import {
  ClockIcon,
  UserIcon,
  StorefrontIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  DatabaseIcon,
} from '@phosphor-icons/react';
import { OrderTrackingStepper } from '../../../components/ui/OrderTrackingStepper';
import { formatStatusText } from '../../../utils/statusFormatter';

export interface AdminOrderDetailModalProps {
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedOrderDetails: any | null;
  loadingDetails: boolean;
  formatCurrency: (val: number) => string;
  handleForceCancel: () => void;
  cancelling: boolean;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  selectedOrderId,
  setSelectedOrderId,
  selectedOrderDetails,
  loadingDetails,
  formatCurrency,
  handleForceCancel,
  cancelling,
}) => {
  return (
    <Dialog
      open={!!selectedOrderId}
      onOpenChange={(open) => !open && setSelectedOrderId(null)}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Order Details
            {selectedOrderDetails && (
              <span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                #{selectedOrderDetails.orderNumber || selectedOrderDetails.id}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Complete platform metadata records and timeline status matching for
            this transaction.
          </DialogDescription>
        </DialogHeader>

        {loadingDetails ? (
          <div className="py-20 text-center">
            <ClockIcon className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-sm text-zinc-500 font-medium">
              Loading full order metadata...
            </p>
          </div>
        ) : selectedOrderDetails ? (
          <div className="space-y-6 py-2 text-zinc-700">
            {/* Stepper display */}
            <div className="border rounded-xl bg-zinc-50/50 p-2">
              <OrderTrackingStepper
                currentStatus={selectedOrderDetails.status}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Columns: Metadata */}
              <div className="md:col-span-2 space-y-6">
                {/* Customer & Seller Info card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4 bg-white border-zinc-200">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <UserIcon className="h-4 w-4 text-zinc-500" />
                      Customer Information
                    </h4>
                    <p className="font-semibold text-zinc-800">
                      {selectedOrderDetails.customer?.name}
                    </p>
                    <div className="text-xs text-zinc-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                        <span>{selectedOrderDetails.customer?.email}</span>
                      </div>
                      {selectedOrderDetails.customer?.phone && (
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{selectedOrderDetails.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4 bg-white border-zinc-200">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <StorefrontIcon className="h-4 w-4 text-zinc-500" />
                      Seller Information
                    </h4>
                    <p className="font-semibold text-zinc-800">
                      {selectedOrderDetails.seller?.shopName}
                    </p>
                    <div className="text-xs text-zinc-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                        <span>
                          {selectedOrderDetails.seller?.user?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Delivery partner info card */}
                <Card className="p-4 bg-white border-zinc-200">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <TruckIcon className="h-4 w-4 text-zinc-500" />
                    Delivery Information
                  </h4>
                  {selectedOrderDetails.delivery?.partner ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-400">
                          Assigned Partner
                        </p>
                        <p className="font-semibold text-zinc-800 mt-0.5">
                          {selectedOrderDetails.delivery.partner.user?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Partner Contact</p>
                        <p className="font-semibold text-zinc-800 mt-0.5">
                          {selectedOrderDetails.delivery.partner.user?.phone ||
                            'No phone recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Delivery Status</p>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded mt-1 whitespace-nowrap">
                          {formatStatusText(
                            selectedOrderDetails.delivery.status,
                          )}
                        </span>
                      </div>
                      {selectedOrderDetails.delivery.deliveredAt && (
                        <div>
                          <p className="text-xs text-zinc-400">Delivered On</p>
                          <p className="text-sm font-semibold text-zinc-800 mt-0.5">
                            {new Date(
                              selectedOrderDetails.delivery.deliveredAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">
                      No delivery partner assigned to this order yet.
                    </p>
                  )}
                </Card>

                {/* Settlement Information */}
                <Card className="p-4 bg-white border-zinc-200">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <DatabaseIcon className="h-4 w-4 text-zinc-500" />
                    Settlement & Escrow
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-400">Escrow Status</p>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mt-1 whitespace-nowrap ${
                          selectedOrderDetails.settlementStatus === 'SETTLED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : selectedOrderDetails.settlementStatus ===
                                'HOLDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {selectedOrderDetails.settlementStatus || 'PENDING'}
                      </span>
                    </div>
                    {selectedOrderDetails.settlementAmount && (
                      <div>
                        <p className="text-xs text-zinc-400">Amount</p>
                        <p className="font-semibold text-zinc-800 mt-0.5">
                          {formatCurrency(
                            parseFloat(selectedOrderDetails.settlementAmount),
                          )}
                        </p>
                      </div>
                    )}
                    {selectedOrderDetails.settlementHeldAt && (
                      <div>
                        <p className="text-xs text-zinc-400">Held At</p>
                        <p className="text-sm font-semibold text-zinc-800 mt-0.5">
                          {new Date(
                            selectedOrderDetails.settlementHeldAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedOrderDetails.settlementReleasedAt && (
                      <div>
                        <p className="text-xs text-zinc-400">Released At</p>
                        <p className="text-sm font-semibold text-zinc-800 mt-0.5">
                          {new Date(
                            selectedOrderDetails.settlementReleasedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Order Items */}
                <Card className="bg-white border-zinc-200 overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-150">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Order Items
                    </h4>
                  </div>
                  <div className="divide-y">
                    {selectedOrderDetails.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productTitle}
                              className="h-10 w-10 object-cover rounded border border-zinc-200 shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-zinc-800">
                              {item.productTitle}
                            </p>
                            <p className="text-xs text-zinc-400 font-mono">
                              SKU: {item.sku}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-zinc-800">
                            {formatCurrency(parseFloat(item.unitPrice))} x{' '}
                            {item.qty}
                          </p>
                          <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                            Total: {formatCurrency(parseFloat(item.totalPrice))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-zinc-50/50 p-4 border-t text-sm space-y-1.5">
                    <div className="flex justify-between text-zinc-500 font-medium">
                      <span>Subtotal</span>
                      <span>
                        {formatCurrency(
                          parseFloat(selectedOrderDetails.subtotal),
                        )}
                      </span>
                    </div>
                    {parseFloat(selectedOrderDetails.shippingCharge) > 0 && (
                      <div className="flex justify-between text-zinc-500 font-medium">
                        <span>Shipping</span>
                        <span>
                          {formatCurrency(
                            parseFloat(selectedOrderDetails.shippingCharge),
                          )}
                        </span>
                      </div>
                    )}
                    {parseFloat(selectedOrderDetails.discount) > 0 && (
                      <div className="flex justify-between text-rose-500 font-medium">
                        <span>
                          Discount ({selectedOrderDetails.couponCode || 'Promo'}
                          )
                        </span>
                        <span>
                          -
                          {formatCurrency(
                            parseFloat(selectedOrderDetails.discount),
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-800 font-extrabold text-base pt-1.5 border-t">
                      <span>Grand Total</span>
                      <span>
                        {formatCurrency(parseFloat(selectedOrderDetails.total))}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Timeline Event Log */}
              <div className="space-y-4">
                <Card className="p-4 bg-white border-zinc-200 h-full flex flex-col">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    Timeline Event Log
                  </h4>
                  <div className="relative border-l border-zinc-200 pl-4 space-y-5 flex-1">
                    {selectedOrderDetails.timeline?.map((evt: any) => (
                      <div key={evt.id} className="relative text-xs">
                        {/* Dot marker */}
                        <span className="absolute -left-5.25 top-1 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white" />
                        <div className="flex items-center justify-between text-zinc-400 font-bold mb-1">
                          <span className="uppercase text-[9px] tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                            {formatStatusText(evt.status)}
                          </span>
                          <span>
                            {new Date(evt.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )}{' '}
                            {new Date(evt.createdAt).toLocaleTimeString(
                              undefined,
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-zinc-600 font-semibold mt-0.5">
                          {evt.note || 'Status updated.'}
                        </p>
                      </div>
                    ))}

                    {(!selectedOrderDetails.timeline ||
                      selectedOrderDetails.timeline.length === 0) && (
                      <p className="text-xs text-zinc-400 italic">
                        No timeline entries recorded.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="outline" onClick={() => setSelectedOrderId(null)}>
            Close Detail Panel
          </Button>
          {selectedOrderDetails &&
            ![
              'delivered',
              'cancelled',
              'delivery_failed',
              'refunded',
              'replaced',
            ].includes(selectedOrderDetails.status) && (
              <Button
                variant="destructive"
                onClick={handleForceCancel}
                disabled={cancelling}
                className="flex items-center gap-1"
              >
                {cancelling ? 'Processing...' : 'Force Cancel Order'}
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
