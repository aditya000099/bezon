import React, { useState } from "react";
import {
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  Camera,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "../../context/ToastContext";

export const DeliveryQueue: React.FC = () => {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);

  // Mock available dispatcher queue tasks
  const [queueTasks, setQueueTasks] = useState([
    {
      id: "BZN-ORD-9021",
      seller: "Acoustic Labs",
      items: "1x Premium Wireless Headphones",
      status: "ready_for_pickup",
      pickup: "Acoustic Warehouse, Sector 4",
      drop: "Flat 102, Block C, Green Apartments, Mumbai",
    },
    {
      id: "BZN-ORD-4491",
      seller: "Sartorial Goods",
      items: "2x Minimalist Leather Wallet",
      status: "ready_for_pickup",
      pickup: "Sartorial Suite 10, Industrial Estate",
      drop: "B-704, Skyline Towers, Link Road, Mumbai",
    },
  ]);

  const handleAcceptTrip = (task: any) => {
    setActiveTrip({ ...task, status: "accepted" });
    setQueueTasks((prev) => prev.filter((t) => t.id !== task.id));
    toast.success(`Trip accepted: ${task.id}. Proceed to pickup!`);
  };

  const handlePickedUp = () => {
    if (!activeTrip) return;
    setActiveTrip({ ...activeTrip, status: "in_transit" });
    toast.info("Status updated: In Transit. Head towards drop-off location.");
  };

  const handleOpenProofOfDelivery = () => {
    setShowProofModal(true);
  };

  const handleSimulatePhoto = () => {
    setIsUploading(true);
    setTimeout(() => {
      setPhotoCaptured(true);
      setIsUploading(false);
      toast.success("Photographic proof of receipt captured successfully.");
    }, 1000);
  };

  const handleCompleteDelivery = () => {
    if (!photoCaptured) {
      toast.warning("Please capture photographic proof before finishing.");
      return;
    }
    toast.success(`Fulfillment Complete! Order ${activeTrip.id} delivered.`);
    setActiveTrip(null);
    setPhotoCaptured(false);
    setShowProofModal(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Availability Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-xl p-4 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`h-3.5 w-3.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
          ></div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Courier Availability:{" "}
              {isAvailable ? "ONLINE & ACTIVE" : "OFFLINE"}
            </p>
            <p className="text-xs text-slate-500">
              You are visible to dispatch routing coordinators.
            </p>
          </div>
        </div>
        <Button
          variant={isAvailable ? "outline" : "default"}
          size="sm"
          onClick={() => setIsAvailable(!isAvailable)}
        >
          {isAvailable ? "Go Offline" : "Go Online"}
        </Button>
      </div>

      {/* Active Trip Section */}
      {activeTrip ? (
        <div className="flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <span className="h-2 w-2 bg-indigo-600 rounded-full animate-ping"></span>
            Current Active Assignment
          </h3>
          <Card className="border-indigo-100 bg-indigo-50/10 shadow-md">
            <CardHeader className="border-b border-indigo-50/55 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-extrabold text-slate-900">
                  {activeTrip.id}
                </CardTitle>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {activeTrip.status.replace(/_/g, " ")}
                </span>
              </div>
              <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                Fulfilling for:{" "}
                <strong className="text-slate-700">{activeTrip.seller}</strong>{" "}
                ({activeTrip.items})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 text-amber-700 rounded-full p-1.5 mt-0.5 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pickup Warehouse
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {activeTrip.pickup}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-700 rounded-full p-1.5 mt-0.5 shrink-0">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Dropoff Destination
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {activeTrip.drop}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t border-slate-100 pt-4 bg-white/50 rounded-b-lg">
              {activeTrip.status === "accepted" ? (
                <Button className="w-full font-bold" onClick={handlePickedUp}>
                  Confirm Package Pickup
                </Button>
              ) : (
                <Button
                  className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleOpenProofOfDelivery}
                >
                  <Camera className="h-4 w-4 mr-2" /> Complete & Capture Proof
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : null}

      {/* Available Queue Tasks */}
      <div className="flex flex-col gap-4">
        <h3 className="font-extrabold text-slate-800 text-lg">
          Available Dispatch Queue
        </h3>
        {queueTasks.length === 0 ? (
          <p className="text-slate-400 text-sm italic">
            No pending packages await allocation.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {queueTasks.map((t) => (
              <Card
                key={t.id}
                className="bg-white border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-base">
                      {t.id}
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Ready for dispatch
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Merchant: {t.seller} ({t.items})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">From:</strong> {t.pickup}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">To:</strong> {t.drop}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-100 pt-4">
                  <Button
                    className="w-full font-bold text-xs"
                    disabled={!isAvailable}
                    onClick={() => handleAcceptTrip(t)}
                  >
                    Accept Trip Assignment
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Proof of Delivery Dialog */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Proof of Delivery (POD)
            </DialogTitle>
            <DialogDescription>
              Capture photographic proof of receipt at the customer address.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50 min-h-50">
            {photoCaptured ? (
              <div className="flex flex-col items-center gap-2 text-center text-emerald-600">
                <CheckCircle2 className="h-12 w-12" />
                <p className="font-bold text-sm">Signature Photo Captured</p>
                <p className="text-[10px] text-slate-400">
                  Timestamp: {new Date().toLocaleTimeString()} · Location Lock
                  verified
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <Camera className="h-10 w-10 text-slate-300" />
                <p className="text-xs text-slate-500">
                  Camera permission authorized
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-bold text-xs"
                  onClick={handleSimulatePhoto}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Simulate Camera Capture"}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-4 border-t border-slate-100 w-full">
            <Button
              variant="outline"
              className="flex-1 font-bold text-xs"
              onClick={() => setShowProofModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCompleteDelivery}
              disabled={!photoCaptured}
            >
              Complete Trip & Sign Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
