import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon, X, PlusCircle } from "lucide-react";
import api from "../../../lib/api";
import { API_ENDPOINTS } from "../../../config/api.config";
import { useToast } from "../../../context/ToastContext";
import type { Category, Product } from "@bezon/types";

interface ImagePayload {
  url: string;
  s3Key: string;
  isPrimary: boolean;
}

interface LocalVariant {
  id?: string;
  sku: string;
  price: number;
  stock: number;
  lowStockAlert: number;
  attributes: Record<string, string>;
  attrKey1?: string;
  attrVal1?: string;
}

interface ProductFormProps {
  product?: Product | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

const buildInitialImages = (product?: Product | null): ImagePayload[] => {
  if (!product) return [];

  return (product.images || []).map((img) => ({
    url: img.url,
    s3Key: img.s3Key || "",
    isPrimary: img.isPrimary,
  }));
};

const buildInitialVariants = (product?: Product | null): LocalVariant[] => {
  if (!product) return [];

  return (product.variants || []).map((variant) => {
    const entries = Object.entries(
      (variant.attributes || {}) as Record<string, string>,
    );
    const [key1, val1] = entries.length > 0 ? entries[0] : ["Color", ""];

    return {
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      stock: variant.stock,
      lowStockAlert: variant.lowStockAlert,
      attributes: variant.attributes as Record<string, string>,
      attrKey1: key1,
      attrVal1: val1,
    };
  });
};

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onCancel,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [totalStock, setTotalStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [images, setImages] = useState<ImagePayload[]>([]);
  const [variants, setVariants] = useState<LocalVariant[]>([]);

  const isEditMode = Boolean(product);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catRes = await api.get(API_ENDPOINTS.categories);
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    setTitle(product?.title || "");
    setBrand(product?.brand || "");
    setDescription(product?.description || "");
    setBasePrice(product ? Number(product.basePrice).toString() : "");
    setComparePrice(
      product?.comparePrice ? Number(product.comparePrice).toString() : "",
    );
    setTotalStock(product ? product.totalStock.toString() : "10");
    setCategoryId(product?.categoryId || "");
    setStatus(product?.status === "published" ? "published" : "draft");
    setImages(buildInitialImages(product));
    setVariants(buildInitialVariants(product));
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploaded: ImagePayload[] = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await api.post(API_ENDPOINTS.media.upload, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data.success) {
          const { url, s3Key } = uploadRes.data.data;
          uploaded.push({
            url,
            s3Key,
            isPrimary: uploaded.length === 0,
          });
        }
      }
      setImages(uploaded);
      toast.success("Images uploaded successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const handleSetPrimary = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const addVariantField = () => {
    setVariants([
      ...variants,
      {
        sku: `${brand.toUpperCase().slice(0, 3) || "BEZ"}-${title.toUpperCase().replace(/\s+/g, "-").slice(0, 5)}-${Math.floor(
          100 + Math.random() * 900,
        )}`,
        price: basePrice ? Number(basePrice) : 0,
        stock: 5,
        lowStockAlert: 3,
        attributes: {},
        attrKey1: "Color",
        attrVal1: "",
      },
    ]);
  };

  const removeVariantField = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantValue = (
    index: number,
    field: keyof LocalVariant,
    value: any,
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !basePrice || !categoryId) {
      toast.error("Title, Base Price, and Category are required.");
      return;
    }

    setSubmitting(true);
    try {
      const parsedVariants = variants.map((variant) => {
        const finalAttributes: Record<string, string> = {};
        if (variant.attrKey1 && variant.attrVal1) {
          finalAttributes[variant.attrKey1.trim()] = variant.attrVal1.trim();
        }

        return {
          id: variant.id,
          sku: variant.sku.trim(),
          price: Number(variant.price),
          stock: Number(variant.stock),
          lowStockAlert: Number(variant.lowStockAlert),
          attributes: finalAttributes,
        };
      });

      const payload = {
        title: title.trim(),
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        basePrice: Number(basePrice),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        totalStock: Number(totalStock),
        categoryId,
        status,
        variants: parsedVariants,
        images,
      };

      if (isEditMode && product) {
        const res = await api.put(
          API_ENDPOINTS.products.update(product.id),
          payload,
        );
        if (res.data.success) {
          toast.success("Product updated successfully.");
          onSuccess?.();
        }
      } else {
        const res = await api.post(API_ENDPOINTS.products.create, payload);
        if (res.data.success) {
          toast.success("Product catalog registered successfully.");
          onSuccess?.();
        }
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to submit product details.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Product Name *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Premium Leather Wallet"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Brand Name
          </label>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Sarto Goods"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
          placeholder="Product summary and details..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Base Price (INR) *
          </label>
          <Input
            type="number"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="₹4999"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Compare Price (INR)
          </label>
          <Input
            type="number"
            min="0"
            value={comparePrice}
            onChange={(e) => setComparePrice(e.target.value)}
            placeholder="₹6999"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Base Inventory Stock
          </label>
          <Input
            type="number"
            min="0"
            value={totalStock}
            onChange={(e) => setTotalStock(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Category *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 cursor-pointer h-10"
            required
            disabled={loadingCategories}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Catalogue Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 cursor-pointer h-10"
          >
            <option value="published">Published</option>
            <option value="draft">Draft (Hidden)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Product Gallery Images
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden group"
            >
              <img
                src={img.url}
                alt="product"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black/90 text-white rounded-full p-1 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {img.isPrimary ? (
                <span className="absolute bottom-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Primary
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(i)}
                  className="absolute bottom-1.5 left-1.5 bg-slate-800/80 hover:bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Set Primary
                </button>
              )}
            </div>
          ))}

          <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors">
            {uploadingImage ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500">
                  Upload Image
                </span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              Product Variants
            </h4>
            <p className="text-[11px] text-slate-400">
              Configure size/color SKUs. Standard item created if variants left
              empty.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1"
            onClick={addVariantField}
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add Variant
          </Button>
        </div>

        {variants.length > 0 && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-62.5 overflow-y-auto">
            {variants.map((variant, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 pb-3 border-b border-slate-200 last:border-b-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Variant #{i + 1}
                  </span>
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                    onClick={() => removeVariantField(i)}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      SKU
                    </label>
                    <Input
                      size={3}
                      className="h-8 text-xs font-mono"
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariantValue(i, "sku", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Price
                    </label>
                    <Input
                      size={3}
                      type="number"
                      className="h-8 text-xs"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariantValue(i, "price", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Stock
                    </label>
                    <Input
                      size={3}
                      type="number"
                      className="h-8 text-xs"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariantValue(i, "stock", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Low Stock Limit
                    </label>
                    <Input
                      size={3}
                      type="number"
                      className="h-8 text-xs"
                      value={variant.lowStockAlert}
                      onChange={(e) =>
                        updateVariantValue(
                          i,
                          "lowStockAlert",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Attribute Type
                    </label>
                    <Input
                      className="h-8 text-xs"
                      value={variant.attrKey1}
                      onChange={(e) =>
                        updateVariantValue(i, "attrKey1", e.target.value)
                      }
                      placeholder="e.g. Color or Size"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Attribute Value
                    </label>
                    <Input
                      className="h-8 text-xs"
                      value={variant.attrVal1}
                      onChange={(e) =>
                        updateVariantValue(i, "attrVal1", e.target.value)
                      }
                      placeholder="e.g. Crimson Red or M"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Submitting..."
            : isEditMode
              ? "Save Changes"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
};
