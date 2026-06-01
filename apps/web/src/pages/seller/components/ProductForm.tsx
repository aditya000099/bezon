import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon, X, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import api from "../../../lib/api";
import { API_ENDPOINTS } from "../../../config/api.config";
import { useToast } from "../../../context/ToastContext";
import type { Category, Product } from "@bezon/types";

interface ImagePayload {
  url: string;
  s3Key: string;
  isPrimary: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

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
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState<number | string>("");
  const [comparePrice, setComparePrice] = useState<number | string>("");
  const [totalStock, setTotalStock] = useState<number | string>(10);
  const [lowStockAlert, setLowStockAlert] = useState<number | string>(3);
  
  const [attrKey, setAttrKey] = useState("Color");
  const [attrVal, setAttrVal] = useState("");
  
  const [images, setImages] = useState<ImagePayload[]>([]);

  // For linking existing products
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const isEditMode = Boolean(product);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setLoadingCategories(true);
        setLoadingProducts(true);
        const [catRes, prodRes] = await Promise.all([
          api.get(API_ENDPOINTS.categories),
          api.get(API_ENDPOINTS.products.sellerMe)
        ]);
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
        if (prodRes.data.success) {
          setSellerProducts(prodRes.data.data);
          
          // Pre-populate linked product IDs if editing a product in a group
          if (product && product.variantGroupId) {
            const siblings = prodRes.data.data.filter(
              (p: Product) => p.variantGroupId === product.variantGroupId && p.id !== product.id
            );
            setLinkedProductIds(siblings.map((s: Product) => s.id));
          }
        }
      } catch (err) {
        console.error("Failed to load dependencies", err);
      } finally {
        setLoadingCategories(false);
        setLoadingProducts(false);
      }
    };
    fetchDependencies();
  }, [product]);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setBrand(product.brand || "");
      setDescription(product.description || "");
      setCategoryId(product.categoryId || "");
      setStatus(product.status === "published" ? "published" : "draft");
      
      setSku(product.sku || "");
      setBasePrice(product.basePrice ? Number(product.basePrice) : "");
      setComparePrice(product.comparePrice ? Number(product.comparePrice) : "");
      setTotalStock(product.totalStock || 0);
      setLowStockAlert(product.lowStockAlert || 5);

      const entries = Object.entries((product.attributes || {}) as Record<string, string>);
      if (entries.length > 0) {
        setAttrKey(entries[0][0]);
        setAttrVal(entries[0][1]);
      } else {
        setAttrKey("Color");
        setAttrVal("");
      }

      setImages((product.images || []).map((img) => ({
        url: img.url,
        s3Key: img.s3Key || "",
        isPrimary: img.isPrimary,
      })));
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const currentImages = [...images];
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
      setImages(currentImages);
      toast.success("Images uploaded successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    const updated = images.filter((_, i) => i !== imageIndex);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const setPrimaryImage = (imageIndex: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === imageIndex,
    }));
    setImages(updated);
  };

  const toggleLinkedProduct = (productId: string) => {
    setLinkedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (!title || !sku || !basePrice) {
      toast.error("Title, SKU, and Base Price are required.");
      return;
    }

    if (images.length === 0) {
      toast.error("At least one image is required.");
      return;
    }

    setSubmitting(true);
    try {
      const attributes: Record<string, string> = {};
      if (attrKey && attrVal) {
        attributes[attrKey] = attrVal;
      }

      const payload = {
        title,
        brand,
        description,
        categoryId,
        status,
        sku,
        basePrice: Number(basePrice),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        totalStock: Number(totalStock),
        lowStockAlert: Number(lowStockAlert),
        attributes,
        images,
        linkedProductIds,
      };

      if (isEditMode && product) {
        await api.put(API_ENDPOINTS.products.update(product.id), payload);
        toast.success("Product updated successfully.");
      } else {
        await api.post(API_ENDPOINTS.products.create, payload);
        toast.success("Product registered successfully.");
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSearchProducts = sellerProducts.filter(p => 
    p.id !== product?.id && 
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-10">
      {/* 1. Basic Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Product Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Premium Wireless Headphones" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Sony" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Category *</label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Select category...</option>
              {loadingCategories ? (
                <option disabled>Loading...</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Detailed description of the product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Product Details */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">2</span>
          Product Specifics
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">SKU *</label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. WH-1000XM4" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Price (₹) *</label>
            <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} min="1" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Compare Price (₹)</label>
            <Input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} min="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Total Stock *</label>
            <Input type="number" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} min="0" required />
          </div>
          
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Distinguishing Attribute (e.g., Color)</label>
            <div className="flex gap-2">
              <Input value={attrKey} onChange={(e) => setAttrKey(e.target.value)} className="w-1/3" placeholder="Key (Color)" />
              <Input value={attrVal} onChange={(e) => setAttrVal(e.target.value)} className="flex-1" placeholder="Value (Midnight Black)" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="mt-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Gallery *</label>
            <div className="relative">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingImage}
              />
              <Button size="sm" type="button" variant="outline" disabled={uploadingImage}>
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                Upload Images
              </Button>
            </div>
          </div>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((img, iIdx) => (
                <div key={iIdx} className={`relative aspect-square rounded-lg border-2 overflow-hidden group ${img.isPrimary ? 'border-primary shadow-sm' : 'border-transparent'}`}>
                  <img src={img.url} alt="Upload preview" className="h-full w-full object-cover bg-slate-200" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={(e) => { e.preventDefault(); setPrimaryImage(iIdx); }}>
                        Make Primary
                      </Button>
                    )}
                    <Button size="icon" variant="destructive" className="h-6 w-6" onClick={(e) => { e.preventDefault(); handleRemoveImage(iIdx); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {img.isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Primary</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
              <span className="text-xs">No images uploaded</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Link Existing Products */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">3</span>
          Link Variants
        </h3>
        <p className="text-xs text-slate-500">
          Search your catalog to select products that belong to the same product family (e.g., different colors/sizes of the same item). 
          They will be grouped together on the store frontend. Note: category will be synchronized across linked variants.
        </p>

        <div className="border border-slate-200 rounded-xl bg-white flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <Input 
              placeholder="Search your products by SKU or Title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {loadingProducts ? (
              <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : filteredSearchProducts.length > 0 ? (
              filteredSearchProducts.map(p => {
                const isLinked = linkedProductIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleLinkedProduct(p.id)}
                    className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors border ${
                      isLinked 
                        ? 'border-indigo-200 bg-indigo-50/50' 
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-sm flex items-center justify-center shrink-0 border ${isLinked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {isLinked && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="h-10 w-10 bg-slate-100 rounded overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          <img src={(p.images as any)[0].url} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-slate-300" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 line-clamp-1">{p.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku} | ₹{Number(p.basePrice).toLocaleString()}</p>
                      </div>
                    </div>
                    {isLinked && <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-100 px-2 py-0.5 rounded-full">Linked</span>}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">No matching products found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Save Changes" : "Publish Product"}
        </Button>
      </div>
    </form>
  );
};
