import { logger } from '@/utils/logger';
import { Button, Input } from '@bezon/ui';
import React, { useEffect, useState } from 'react';
import {
  SpinnerIcon,
  ImageIcon,
  XIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import api from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api.config';
import { useToast } from '../../../context/ToastContext';
import type { Category, Product } from '@bezon/types';

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

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [showAIInput, setShowAIInput] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const [sku, setSku] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>('');
  const [comparePrice, setComparePrice] = useState<number | string>('');
  const [totalStock, setTotalStock] = useState<number | string>(10);
  const [lowStockAlert, setLowStockAlert] = useState<number | string>(3);

  const [attrKey, setAttrKey] = useState('Color');
  const [attrVal, setAttrVal] = useState('');

  const [images, setImages] = useState<ImagePayload[]>([]);

  // For linking existing products
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [availablePolicies, setAvailablePolicies] = useState<any[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const isEditMode = Boolean(product);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setLoadingCategories(true);
        setLoadingProducts(true);
        setLoadingPolicies(true);
        const [catRes, prodRes, polRes] = await Promise.all([
          api.get(API_ENDPOINTS.categories.base),
          api.get(API_ENDPOINTS.products.sellerMe),
          api.get(`${API_ENDPOINTS.policies.list}?active=true`),
        ]);
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
        if (prodRes.data.success) {
          setSellerProducts(prodRes.data.data);

          // Pre-populate linked product IDs if editing a product in a group
          if (product && product.variantGroupId) {
            const siblings = prodRes.data.data.filter(
              (p: Product) =>
                p.variantGroupId === product.variantGroupId &&
                p.id !== product.id,
            );
            setLinkedProductIds(siblings.map((s: Product) => s.id));
          }
        }
        if (polRes.data.success) {
          setAvailablePolicies(polRes.data.data);
        }
      } catch (err) {
        logger.error('Failed to load dependencies', err);
      } finally {
        setLoadingCategories(false);
        setLoadingProducts(false);
        setLoadingPolicies(false);
      }
    };
    fetchDependencies();
  }, [product]);

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setBrand(product.brand || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || '');
      setStatus(product.status === 'published' ? 'published' : 'draft');

      setSku(product.sku || '');
      setBasePrice(product.basePrice ? Number(product.basePrice) : '');
      setComparePrice(product.comparePrice ? Number(product.comparePrice) : '');
      setTotalStock(product.totalStock || 0);
      setLowStockAlert(product.lowStockAlert || 5);

      const entries = Object.entries(
        (product.attributes || {}) as Record<string, string>,
      );
      if (entries.length > 0) {
        setAttrKey(entries[0][0]);
        setAttrVal(entries[0][1]);
      } else {
        setAttrKey('Color');
        setAttrVal('');
      }

      setImages(
        (product.images || []).map((img) => ({
          url: img.url,
          s3Key: img.s3Key || '',
          isPrimary: img.isPrimary,
        })),
      );

      // Pre-populate policy selections
      if (product.policies && Array.isArray(product.policies)) {
        setSelectedPolicyIds(
          (product as any).policies
            .map((pp: any) => pp.policyId ?? pp.id)
            .filter(Boolean),
        );
      }
    }
  }, [product]);

  const handleGenerateAI = async () => {
    if (!shortDescription) {
      toast.error('Please enter a short description first.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await api.post(API_ENDPOINTS.products.generateDescription, {
        shortDescription,
      });
      if (res.data.success) {
        setDescription(res.data.data);
        setShowAIInput(false);
        setShortDescription('');
        toast.success('AI description generated successfully.');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to generate AI description.',
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const currentImages = [...images];
      let failedCount = 0;
      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData();
          formData.append('image', files[i]);

          const uploadRes = await api.post(
            API_ENDPOINTS.media.upload,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            },
          );

          if (uploadRes.data.success) {
            const { url, s3Key } = uploadRes.data.data;
            currentImages.push({
              url,
              s3Key,
              isPrimary: currentImages.length === 0,
            });
          }
        } catch (imgErr: any) {
          failedCount++;
          logger.error(`Failed to upload image ${files[i].name}:`, imgErr);
          toast.error(
            imgErr.response?.data?.message ||
              `Failed to upload ${files[i].name}`,
          );
        }
      }
      setImages(currentImages);
      if (failedCount > 0) {
        // Specific errors are shown above per image
      }
      if (currentImages.length > images.length) {
        toast.success('Images uploaded successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      // Reset the input so the same file(s) can be re-selected
      e.target.value = '';
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
    setLinkedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const togglePolicy = (policyId: string) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      toast.error('Please select a category.');
      return;
    }

    if (!title || !sku || !basePrice) {
      toast.error('Title, SKU, and Base Price are required.');
      return;
    }

    if (images.length === 0) {
      toast.error('At least one image is required.');
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
        policyIds: selectedPolicyIds,
      };

      if (isEditMode && product) {
        await api.put(API_ENDPOINTS.products.update(product.id), payload);
        toast.success('Product updated successfully.');
      } else {
        await api.post(API_ENDPOINTS.products.create, payload);
        toast.success('Product registered successfully.');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSearchProducts = sellerProducts.filter(
    (p) =>
      p.id !== product?.id &&
      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-10">
      {/* 1. Basic Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
            1
          </span>
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              Product Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Premium Wireless Headphones"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              Brand
            </label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Sony"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              Category *
            </label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select category...
              </option>
              {loadingCategories ? (
                <option disabled>Loading...</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Description
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2"
                onClick={() => setShowAIInput(!showAIInput)}
              >
                <SparkleIcon className="h-3 w-3 mr-1" weight="fill" />
                AI Write
              </Button>
            </div>

            {showAIInput && (
              <div className="flex gap-2 p-3 bg-teal-50/50 border border-teal-100 rounded-md mb-1 animate-in fade-in slide-in-from-top-1">
                <Input
                  className="h-8 bg-white"
                  placeholder="E.g. wireless noise cancelling headphones with 30hr battery..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateAI();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-teal-600 hover:bg-teal-700"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || !shortDescription}
                >
                  {isGeneratingAI ? (
                    <SpinnerIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            )}

            <textarea
              className="flex min-h-25 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Detailed description of the product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Product Details */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
            2
          </span>
          Product Specifics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              SKU *
            </label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. WH-1000XM4"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Discounted Price (₹) *
            </label>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Actual Price (₹)
            </label>
            <Input
              type="number"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              min="1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Total Stock *
            </label>
            <Input
              type="number"
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Distinguishing Attribute (e.g., Color)
            </label>
            <div className="flex gap-2">
              <Input
                value={attrKey}
                onChange={(e) => setAttrKey(e.target.value)}
                className="w-1/3"
                placeholder="Key (Color)"
              />
              <Input
                value={attrVal}
                onChange={(e) => setAttrVal(e.target.value)}
                className="flex-1"
                placeholder="Value (Midnight Black)"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="mt-2 border border-zinc-100 bg-zinc-50/50 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Product Gallery *
            </label>
            <div className="relative">
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingImage}
              />
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                Upload Images
              </Button>
            </div>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((img, iIdx) => (
                <div
                  key={iIdx}
                  className={`relative aspect-square rounded-lg border-2 overflow-hidden group ${img.isPrimary ? 'border-primary shadow-sm' : 'border-transparent'}`}
                >
                  <img
                    src={img.url}
                    alt="Upload preview"
                    className="h-full w-full object-cover bg-zinc-200"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-[10px]"
                        onClick={(e) => {
                          e.preventDefault();
                          setPrimaryImage(iIdx);
                        }}
                      >
                        Make Primary
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveImage(iIdx);
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  {img.isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 border-2 border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center text-zinc-400">
              <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
              <span className="text-xs">No images uploaded</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Link Existing Products */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
            3
          </span>
          Link Variants
        </h3>
        <p className="text-xs text-zinc-500">
          Search your catalog to select products that belong to the same product
          family (e.g., different colors/sizes of the same item). They will be
          grouped together on the store frontend. Note: category will be
          synchronized across linked variants.
        </p>

        <div className="border border-zinc-200 rounded-xl bg-white flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-100 bg-zinc-50/50">
            <Input
              placeholder="Search your products by SKU or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {loadingProducts ? (
              <div className="p-4 flex justify-center">
                <SpinnerIcon className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : filteredSearchProducts.length > 0 ? (
              filteredSearchProducts.map((p) => {
                const isLinked = linkedProductIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleLinkedProduct(p.id)}
                    className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors border ${
                      isLinked
                        ? 'border-teal-200 bg-teal-50/50'
                        : 'border-transparent hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-sm flex items-center justify-center shrink-0 border ${isLinked ? 'bg-teal-600 border-teal-600' : 'border-zinc-300'}`}
                      >
                        {isLinked && (
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="h-10 w-10 bg-zinc-100 rounded overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          <img
                            src={(p.images as any)[0].url}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-800 line-clamp-1">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          SKU: {p.sku} | ₹{Number(p.basePrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {isLinked && (
                      <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-100 px-2 py-0.5 rounded-full">
                        Linked
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-zinc-400">
                No matching products found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Product Policies */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
            4
          </span>
          Product Policies
        </h3>
        <p className="text-xs text-zinc-500">
          Select the return, refund, and replacement policies that apply to this
          product. These policies are managed by the platform admin.
        </p>

        {loadingPolicies ? (
          <div className="p-4 flex justify-center">
            <SpinnerIcon className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : availablePolicies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availablePolicies.map((policy: any) => {
              const isSelected = selectedPolicyIds.includes(policy.id);
              const typeColors: Record<string, string> = {
                return: 'bg-blue-50 border-blue-200 text-blue-700',
                refund: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                replace: 'bg-amber-50 border-amber-200 text-amber-700',
              };
              const typeIcons: Record<string, string> = {
                return: '↩️',
                refund: '💰',
                replace: '🔄',
              };
              return (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => togglePolicy(policy.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border-2 ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50/50 shadow-sm'
                      : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-zinc-300'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-800">
                        {policy.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${typeColors[policy.type] || 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {typeIcons[policy.type] || ''} {policy.type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {policy.durationDays}-day window
                      {policy.description ? ` — ${policy.description}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center text-sm text-zinc-400">
            <ShieldCheckIcon className="h-5 w-5 mx-auto mb-1 opacity-50" />
            No policies available. Contact your platform admin.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Publish Product'}
        </Button>
      </div>
    </form>
  );
};
