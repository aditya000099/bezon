import { Card, Button, Input } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SpinnerIcon,
  PackageIcon,
  MagnifyingGlassIcon,
  WarningIcon,
  ArrowsClockwiseIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import type { Product } from "@bezon/types";

interface FlatInventoryItem {
  productId: string;
  productTitle: string;
  productBrand: string | null;
  variantId: string; // Keep for compatibility or rename to productId internally if easier
  sku: string;
  price: number;
  stock: number;
  lowStockAlert: number;
  attributes: Record<string, string>;
  isEditingStock: boolean;
  tempStock: string;
  isEditingAlert: boolean;
  tempAlert: string;
  updating: boolean;
}

export const SellerInventory: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<FlatInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.products.sellerMe);
      if (res.data.success) {
        const flatItems: FlatInventoryItem[] = [];
        (res.data.data as Product[]).forEach((p) => {
          flatItems.push({
            productId: p.id,
            productTitle: p.title,
            productBrand: p.brand || null,
            variantId: p.id,
            sku: p.sku,
            price: Number(p.basePrice),
            stock: p.totalStock,
            lowStockAlert: p.lowStockAlert,
            attributes: p.attributes as Record<string, string>,
            isEditingStock: false,
            tempStock: p.totalStock.toString(),
            isEditingAlert: false,
            tempAlert: p.lowStockAlert.toString(),
            updating: false,
          });
        });
        setItems(flatItems);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not fetch shop inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateVariant = async (index: number) => {
    const item = items[index];
    const newStock = Number(item.tempStock);
    const newAlert = Number(item.tempAlert);

    if (isNaN(newStock) || newStock < 0 || isNaN(newAlert) || newAlert < 0) {
      toast.error("Stock and Low Stock threshold must be positive integers.");
      return;
    }

    // Set updating loading state
    const updated = [...items];
    updated[index].updating = true;
    setItems(updated);

    try {
      // Put to /products/:id with the product update
      const res = await api.put(API_ENDPOINTS.products.update(item.productId), {
        totalStock: newStock,
        lowStockAlert: newAlert,
      });

      if (res.data.success) {
        toast.success(`Inventory for SKU: ${item.sku} updated!`);
        // Turn off edit modes and apply values
        const applyUpdate = [...items];
        applyUpdate[index] = {
          ...applyUpdate[index],
          stock: newStock,
          lowStockAlert: newAlert,
          isEditingStock: false,
          isEditingAlert: false,
          updating: false,
        };
        setItems(applyUpdate);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to update variant stock.",
      );
      const resetLoading = [...items];
      resetLoading[index].updating = false;
      setItems(resetLoading);
    }
  };

  // Quick controls
  const adjustStockTemp = (index: number, change: number) => {
    const updated = [...items];
    const currentVal = Number(updated[index].tempStock) || 0;
    updated[index].tempStock = Math.max(0, currentVal + change).toString();
    updated[index].isEditingStock = true;
    setItems(updated);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.productBrand &&
        item.productBrand.toLowerCase().includes(searchQuery.toLowerCase()));

    const isLowStock = item.stock <= item.lowStockAlert;

    return matchesSearch && (!filterLowStock || isLowStock);
  });

  const lowStockCount = items.filter((i) => i.stock <= i.lowStockAlert).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top metric panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center gap-4 p-5">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <PackageIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              Total Tracked SKUs
            </span>
            <span className="text-xl font-extrabold text-zinc-800">
              {items.length} Variants
            </span>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center gap-4 p-5">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
          >
            <WarningIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              Low Stock Alerts
            </span>
            <span
              className={`text-xl font-extrabold ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}
            >
              {lowStockCount} items low
            </span>
          </div>
        </Card>
      </div>

      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute inset-y-0 left-3 flex items-center text-zinc-400 h-4 w-4 mt-3" />
          <Input
            type="text"
            className="pl-9"
            placeholder="Filter by title, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <Button
            variant={filterLowStock ? "destructive" : "outline"}
            className="text-xs font-bold flex items-center gap-1.5"
            onClick={() => setFilterLowStock(!filterLowStock)}
          >
            <WarningIcon className="h-3.5 w-3.5" />
            {filterLowStock ? "Show All Items" : "Show Low Stock"}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={fetchInventory}
          >
            <ArrowsClockwiseIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Inventory Listings Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading stock levels...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50">
          <PackageIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">No matching items found</p>
          <p className="text-xs text-zinc-400 mt-1">
            Inventory list matches all standard criteria.
          </p>
        </Card>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">SKU / Item</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock Level</th>
                <th className="px-6 py-3.5">Warning Alert</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
              {filteredItems.map((item) => {
                const globalIndex = items.findIndex(
                  (i) => i.variantId === item.variantId,
                );
                const isLow = item.stock <= item.lowStockAlert;
                const attributesText = Object.entries(item.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ");

                return (
                  <tr
                    key={item.variantId}
                    className={`hover:bg-zinc-50/50 transition-colors ${isLow ? "bg-amber-50/20" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-bold text-zinc-900">
                        {item.sku}
                      </p>
                      <p className="font-bold text-zinc-800 mt-0.5 line-clamp-1">
                        {item.productTitle}
                      </p>
                      {attributesText && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {attributesText}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-800">
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded border-zinc-200 text-zinc-500"
                          onClick={() => adjustStockTemp(globalIndex, -1)}
                          disabled={item.updating}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 w-16 text-center text-xs font-semibold"
                          value={item.tempStock}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[globalIndex].tempStock = e.target.value;
                            updated[globalIndex].isEditingStock = true;
                            setItems(updated);
                          }}
                          disabled={item.updating}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded border-zinc-200 text-zinc-500"
                          onClick={() => adjustStockTemp(globalIndex, 1)}
                          disabled={item.updating}
                        >
                          +
                        </Button>
                        {isLow && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                            <WarningIcon className="h-3 w-3" /> Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        min="0"
                        className="h-8 w-16 text-center text-xs font-semibold"
                        value={item.tempAlert}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[globalIndex].tempAlert = e.target.value;
                          updated[globalIndex].isEditingAlert = true;
                          setItems(updated);
                        }}
                        disabled={item.updating}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold px-2 py-1 flex items-center gap-1 h-8 text-zinc-500 hover:text-zinc-800"
                          onClick={() =>
                            navigate(`/seller/products?edit=${item.productId}`)
                          }
                        >
                          Edit Info
                        </Button>
                        {(item.isEditingStock || item.isEditingAlert) && (
                          <Button
                            size="sm"
                            className="text-xs font-bold px-3 py-1 flex items-center gap-1.5 h-8"
                            onClick={() => handleUpdateVariant(globalIndex)}
                            disabled={item.updating}
                          >
                            {item.updating ? (
                              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckIcon className="h-3.5 w-3.5" /> Save
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
