import { Button, Input, Card } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  Image as ImageIcon,
  SpinnerIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import type { Product } from "@bezon/types";

export const SellerProducts: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get(API_ENDPOINTS.products.sellerMe);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not fetch shop listings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle edit query parameter from other views (like Inventory)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      navigate(`/seller/products/${editId}/edit`);
    }
  }, [searchParams]);

  // Archive Product
  const handleArchive = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to archive this product list? This will remove it from the customer catalogue.",
      )
    )
      return;

    try {
      const res = await api.delete(API_ENDPOINTS.products.delete(id));
      if (res.data.success) {
        toast.success("Product successfully archived.");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not archive product.");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Control */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search my products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => navigate("/seller/add-product")}
          className="w-full sm:w-auto font-bold flex items-center gap-2  hover:cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Main Listing View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading product listings...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50">
          <SparkleIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">No products registered yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Get started by creating your first product listing.
          </p>
        </Card>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Stats</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
              {filteredProducts.map((p) => {
                const primaryImage =
                  p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-800 line-clamp-1">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
                          {p.brand || "Unbranded"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-100 text-zinc-600 font-semibold px-2.5 py-1 rounded-full text-xs">
                        {p.category?.name || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900">
                      ₹{Number(p.basePrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${p.totalStock === 0 ? "text-rose-600 font-bold" : "text-zinc-600"}`}
                      >
                        {p.totalStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs font-bold text-teal-600 hover:text-teal-800 p-0 h-auto hover:cursor-pointer"
                        onClick={() =>
                          navigate(`/seller/products/${p.id}/stats`)
                        }
                      >
                        View Stats
                      </Button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-800 hover:cursor-pointer"
                          onClick={() =>
                            navigate(`/seller/products/${p.id}/edit`)
                          }
                        >
                          <PencilSimpleIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 hover:cursor-pointer"
                          onClick={() => handleArchive(p.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
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
