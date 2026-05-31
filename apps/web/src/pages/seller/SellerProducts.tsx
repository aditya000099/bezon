import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Sparkles, X, PlusCircle } from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import type { Product, Category, ProductVariant } from '@bezon/types';

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

export const SellerProducts: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [totalStock, setTotalStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [images, setImages] = useState<ImagePayload[]>([]);
  const [variants, setVariants] = useState<LocalVariant[]>([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get(API_ENDPOINTS.products.sellerMe);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not fetch shop listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load categories
    const loadCategories = async () => {
      try {
        const catRes = await api.get(API_ENDPOINTS.categories);
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  // Handle edit query parameter from other views (like Inventory)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const productToEdit = products.find((p) => p.id === editId);
      if (productToEdit) {
        handleOpenEdit(productToEdit);
        // Clear param so modal doesn't keep opening on page updates
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('edit');
        setSearchParams(newParams);
      }
    }
  }, [searchParams, products]);

  // Handle Image Uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploaded: ImagePayload[] = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await api.post(API_ENDPOINTS.media.upload, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          const { url, s3Key } = uploadRes.data.data;
          uploaded.push({
            url,
            s3Key,
            isPrimary: uploaded.length === 0, // Mark first uploaded image as primary
          });
        }
      }
      setImages(uploaded);
      toast.success('Images uploaded successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image from state
  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // Re-adjust primary check if primary was deleted
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  // Set image as primary
  const handleSetPrimary = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  // Variant Helpers
  const addVariantField = () => {
    setVariants([
      ...variants,
      {
        sku: `${brand.toUpperCase().slice(0,3) || 'BEZ'}-${title.toUpperCase().replace(/\s+/g,'-').slice(0,5)}-${Math.floor(100+Math.random()*900)}`,
        price: basePrice ? Number(basePrice) : 0,
        stock: 5,
        lowStockAlert: 3,
        attributes: {},
        attrKey1: 'Color',
        attrVal1: '',
      },
    ]);
  };

  const removeVariantField = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantValue = (index: number, field: keyof LocalVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentProductId(null);
    setTitle('');
    setBrand('');
    setDescription('');
    setBasePrice('');
    setComparePrice('');
    setTotalStock('10');
    setCategoryId('');
    setStatus('published');
    setImages([]);
    setVariants([]);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (product: Product) => {
    setDialogMode('edit');
    setCurrentProductId(product.id);
    setTitle(product.title);
    setBrand(product.brand || '');
    setDescription(product.description || '');
    setBasePrice(Number(product.basePrice).toString());
    setComparePrice(product.comparePrice ? Number(product.comparePrice).toString() : '');
    setTotalStock(product.totalStock.toString());
    setCategoryId(product.categoryId || '');
    setStatus(product.status === 'published' ? 'published' : 'draft');
    setImages(
      (product.images || []).map((img) => ({
        url: img.url,
        s3Key: img.s3Key || '',
        isPrimary: img.isPrimary,
      }))
    );

    // Map nested variants from Prisma client
    setVariants(
      (product.variants || []).map((v) => {
        const entries = Object.entries((v.attributes || {}) as Record<string, string>);
        const [key1, val1] = entries.length > 0 ? entries[0] : ['Color', ''];
        return {
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          stock: v.stock,
          lowStockAlert: v.lowStockAlert,
          attributes: v.attributes as Record<string, string>,
          attrKey1: key1,
          attrVal1: val1,
        };
      })
    );

    setIsDialogOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !basePrice || !categoryId) {
      toast.error('Title, Base Price, and Category are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Map local variants back to request payload structure
      const parsedVariants = variants.map((v) => {
        const finalAttributes: Record<string, string> = {};
        if (v.attrKey1 && v.attrVal1) {
          finalAttributes[v.attrKey1.trim()] = v.attrVal1.trim();
        }
        return {
          id: v.id,
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          lowStockAlert: Number(v.lowStockAlert),
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

      if (dialogMode === 'create') {
        const res = await api.post(API_ENDPOINTS.products.create, payload);
        if (res.data.success) {
          toast.success('Product catalog registered successfully.');
          setIsDialogOpen(false);
          fetchData();
        }
      } else {
        const res = await api.put(API_ENDPOINTS.products.update(currentProductId!), payload);
        if (res.data.success) {
          toast.success('Product updated successfully.');
          setIsDialogOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit product details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Archive Product
  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product list? This will remove it from the customer catalogue.')) return;

    try {
      const res = await api.delete(API_ENDPOINTS.products.delete(id));
      if (res.data.success) {
        toast.success('Product successfully archived.');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not archive product.');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Control */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search my products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto font-bold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Main Listing View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold">Loading product listings...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 p-8 border-dashed border-2 bg-white/50">
          <Sparkles className="h-12 w-12 text-slate-300 mb-2" />
          <p className="font-bold text-slate-700">No products registered yet</p>
          <p className="text-xs text-slate-400 mt-1">Get started by creating your first product listing.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredProducts.map((p) => {
                const primaryImage = p.images?.find((img) => img.isPrimary) || p.images?.[0];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {primaryImage ? (
                          <img src={primaryImage.url} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{p.title}</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{p.brand || 'Unbranded'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full text-xs">
                        {p.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{Number(p.basePrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${p.totalStock === 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {p.totalStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-800" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleArchive(p.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit/Create Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {dialogMode === 'create' ? 'Register New Product' : 'Modify Product Listing'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Publish item attributes, pricing details, manage variants, and upload gallery imagery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Premium Leather Wallet" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Name</label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Sarto Goods" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Price (INR) *</label>
                <Input type="number" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="₹4999" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compare Price (INR)</label>
                <Input type="number" min="0" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="₹6999" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Inventory Stock</label>
                <Input type="number" min="0" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} placeholder="10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 cursor-pointer h-10"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalogue Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 cursor-pointer h-10"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Gallery Media upload section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Product Gallery Images</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden group">
                    <img src={img.url} alt="product" className="h-full w-full object-cover" />
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
                      <span className="text-[10px] font-bold text-slate-500">Upload Image</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            {/* Custom product variant section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Product Variants</h4>
                  <p className="text-[11px] text-slate-400">Configure size/color SKUs. Standard item created if variants left empty.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="text-xs flex items-center gap-1" onClick={addVariantField}>
                  <PlusCircle className="h-3.5 w-3.5" /> Add Variant
                </Button>
              </div>

              {variants.length > 0 && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[250px] overflow-y-auto">
                  {variants.map((v, i) => (
                    <div key={i} className="flex flex-col gap-3 pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Variant #{i+1}</span>
                        <button type="button" className="text-rose-500 hover:text-rose-700 text-xs font-semibold" onClick={() => removeVariantField(i)}>
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">SKU</label>
                          <Input size={3} className="h-8 text-xs font-mono" value={v.sku} onChange={(e) => updateVariantValue(i, 'sku', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Price</label>
                          <Input size={3} type="number" className="h-8 text-xs" value={v.price} onChange={(e) => updateVariantValue(i, 'price', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Stock</label>
                          <Input size={3} type="number" className="h-8 text-xs" value={v.stock} onChange={(e) => updateVariantValue(i, 'stock', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Low Stock Limit</label>
                          <Input size={3} type="number" className="h-8 text-xs" value={v.lowStockAlert} onChange={(e) => updateVariantValue(i, 'lowStockAlert', Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Attribute Type</label>
                          <Input className="h-8 text-xs" value={v.attrKey1} onChange={(e) => updateVariantValue(i, 'attrKey1', e.target.value)} placeholder="e.g. Color or Size" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Attribute Value</label>
                          <Input className="h-8 text-xs" value={v.attrVal1} onChange={(e) => updateVariantValue(i, 'attrVal1', e.target.value)} placeholder="e.g. Crimson Red or M" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : dialogMode === 'create' ? 'Create Product' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
