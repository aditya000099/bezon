import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon, X, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../../lib/api";
import { API_ENDPOINTS } from "../../../config/api.config";
import { useToast } from "../../../context/ToastContext";
import type { Category, Product } from "@bezon/types";

// A single uploaded image's data
interface ImagePayload {
  url: string;
  s3Key: string;
  isPrimary: boolean;
}

// A variant as it lives in the form (before sending to API)
interface LocalVariant {
  id?: string;
  sku: string;
  price: number | string;
  stock: number | string;
  lowStockAlert: number | string;
  attributes: Record<string, string>;
  attrKey1?: string;
  attrVal1?: string;
  images: ImagePayload[];
}

interface ProductFormProps {
  product?: Product | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

// When editing, convert the API's variant data into our local form shape
const buildInitialVariants = (product?: Product | null): LocalVariant[] => {
  if (!product || !product.variants || product.variants.length === 0) {
    // Always start with one empty variant (it's required)
    return [
      {
        sku: "",
        price: "",
        stock: 5,
        lowStockAlert: 3,
        attributes: {},
        attrKey1: "Color",
        attrVal1: "",
        images: [],
      },
    ];
  }

  return product.variants.map((variant) => {
    const entries = Object.entries(
      (variant.attributes || {}) as Record<string, string>,
    );
    const [key1, val1] = entries.length > 0 ? entries[0] : ["Color", ""];

    // Pull images from the variant (they live here now)
    const variantImages: ImagePayload[] = (variant.images || []).map((img) => ({
      url: img.url,
      s3Key: img.s3Key || "",
      isPrimary: img.isPrimary,
    }));

    return {
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      stock: variant.stock,
      lowStockAlert: variant.lowStockAlert,
      attributes: variant.attributes as Record<string, string>,
      attrKey1: key1,
      attrVal1: val1,
      images: variantImages,
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
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);

  // Product-level fields
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [totalStock, setTotalStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  // Variant-level state (always at least 1 variant)
  const [variants, setVariants] = useState<LocalVariant[]>([]);

  // Track which variant cards are expanded
  const [expandedVariants, setExpandedVariants] = useState<Record<number, boolean>>({});

  const isEditMode = Boolean(product);

  // Load categories on mount
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

  // Fill in form fields when editing a product
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

    const initialVariants = buildInitialVariants(product);
    setVariants(initialVariants);

    // Expand the first variant by default
    const expanded: Record<number, boolean> = {};
    initialVariants.forEach((_, i) => { expanded[i] = true; });
    setExpandedVariants(expanded);
  }, [product]);

  // Toggle a variant card open/closed
  const toggleVariantExpanded = (index: number) => {
    setExpandedVariants((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Upload images for a specific variant
  const handleVariantImageUpload = async (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingVariantIndex(variantIndex);
    try {
      const currentImages = [...variants[variantIndex].images];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("image", files[i]);

        const uploadRes = await api.post(API_ENDPOINTS.media.upload, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data.success) {
          const { url, s3Key } = uploadRes.data.data;
          currentImages.push({
            url,
            s3Key,
            isPrimary: currentImages.length === 0,
          });
        }
      }
      updateVariantValue(variantIndex, "images", currentImages);
      toast.success("Images uploaded successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingVariantIndex(null);
    }
  };

  // Remove an image from a specific variant
  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    const updated = [...variants];
    const images = updated[variantIndex].images.filter((_, i) => i !== imageIndex);
    // If we removed the primary, make the first remaining image primary
    if (images.length > 0 && !images.some((img) => img.isPrimary)) {
      images[0].isPrimary = true;
    }
    updated[variantIndex] = { ...updated[variantIndex], images };
    setVariants(updated);
  };

  // Set an image as the primary for its variant
  const handleSetVariantPrimary = (variantIndex: number, imageIndex: number) => {
    const updated = [...variants];
    updated[variantIndex] = {
      ...updated[variantIndex],
      images: updated[variantIndex].images.map((img, i) => ({
        ...img,
        isPrimary: i === imageIndex,
      })),
    };
    setVariants(updated);
  };

  // Add a new blank variant
  const addVariantField = () => {
    const newIndex = variants.length;
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
        images: [],
      },
    ]);
    setExpandedVariants((prev) => ({ ...prev, [newIndex]: true }));
  };

  // Remove a variant (but never the first one — at least 1 is required)
  const removeVariantField = (index: number) => {
    if (variants.length <= 1) {
      toast.error("At least one variant is required.");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Update a single field on a variant
  const updateVariantValue = (
    index: number,
    field: keyof LocalVariant,
    value: any,
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Submit the form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !basePrice || !categoryId) {
      toast.error("Title, Base Price, and Category are required.");
      return;
    }

    if (variants.length === 0) {
      toast.error("At least one variant is required.");
      return;
    }

    // Check that each variant has a SKU and price
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].sku || !variants[i].price) {
        toast.error(`Variant #${i + 1} needs a SKU and price.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build the variant array for the API
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
          images: variant.images,
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
      {/* ── Product Basic Details ── */}
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

      {/* ── Variants Section (at least 1 required) ── */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              Product Variants
            </h4>
            <p className="text-[11px] text-slate-400">
              At least one variant is required. Each variant has its own images.
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

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {variants.map((variant, i) => (
            <div
              key={i}
              className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden"
            >
              {/* Variant header (click to expand/collapse) */}
              <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleVariantExpanded(i)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Variant #{i + 1}
                    {i === 0 && " (required)"}
                  </span>
                  {variant.sku && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {variant.sku}
                    </span>
                  )}
                  {variant.images.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      {variant.images.length} img{variant.images.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {i > 0 && (
                    <button
                      type="button"
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVariantField(i);
                      }}
                    >
                      Remove
                    </button>
                  )}
                  {expandedVariants[i] ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Variant body (collapsible) */}
              {expandedVariants[i] && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-200">
                  {/* Variant detail fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
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

                  {/* Attribute key/value pair */}
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

                  {/* Variant-specific image gallery */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      Variant Images
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {variant.images.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="aspect-square bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden group"
                        >
                          <img
                            src={img.url}
                            alt="variant"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantImage(i, imgIdx)}
                            className="absolute top-1 right-1 bg-black/75 hover:bg-black/90 text-white rounded-full p-0.5 transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {img.isPrimary ? (
                            <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase tracking-wider">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetVariantPrimary(i, imgIdx)}
                              className="absolute bottom-1 left-1 bg-slate-800/80 hover:bg-slate-900 text-white text-[8px] font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Set Primary
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Upload button */}
                      <label className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:bg-slate-200 hover:border-slate-300 transition-colors">
                        {uploadingVariantIndex === i ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500">
                              Upload
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleVariantImageUpload(i, e)}
                          disabled={uploadingVariantIndex === i}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit Buttons ── */}
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
