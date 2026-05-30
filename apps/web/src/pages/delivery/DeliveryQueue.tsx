import React from 'react';
import { Truck, MapPin, Navigation } from 'lucide-react';

export const DeliveryQueue: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <Truck className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold text-slate-800">You are currently Available for orders.</span>
      </div>

      <h3 className="font-extrabold text-slate-800 text-lg">Active Deliveries</h3>

      <div className="flex flex-col gap-4">
        {[
          { id: 'BZN-002', status: 'out_for_delivery', pickup: 'Shop A, Sector 4', drop: 'Flat 102, Block C, Green Apartments' }
        ].map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">{t.id}</span>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded capitalize">{t.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p><strong>Pickup:</strong> {t.pickup}</p>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p><strong>Dropoff:</strong> {t.drop}</p>
              </div>
            </div>
            <button className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-lg font-bold text-sm shadow-md transition-colors mt-2">
              Accept Trip
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
