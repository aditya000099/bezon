import { Button, Input, Card } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  ListIcon,
  SpinnerIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  MagnifyingGlassIcon,
  PackageIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  isActive: boolean;
  parent?: {
    id: string;
    name: string;
  };
  _count: {
    products: number;
  };
}

const defaultForm = {
  name: "",
  description: "",
  parentId: "",
  isActive: true,
};

export const AdminCategories: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(defaultForm);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.categories.adminList);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setCurrentCategoryId(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setDialogMode("edit");
    setCurrentCategoryId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "",
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        parentId: form.parentId || undefined,
        isActive: form.isActive,
      };

      if (dialogMode === "create") {
        const res = await api.post(API_ENDPOINTS.categories.create, payload);
        if (res.data.success) {
          toast.success("Category created successfully.");
          setIsDialogOpen(false);
          fetchCategories();
        }
      } else {
        const res = await api.put(
          API_ENDPOINTS.categories.update(currentCategoryId!),
          payload,
        );
        if (res.data.success) {
          toast.success("Category updated successfully.");
          setIsDialogOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category._count.products > 0) {
      toast.error(
        "Cannot delete this category because it has products assigned. Please deactivate it instead.",
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await api.delete(
        API_ENDPOINTS.categories.delete(category.id),
      );
      if (res.data.success) {
        toast.success("Category deleted.");
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not delete category.");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const res = await api.put(API_ENDPOINTS.categories.update(category.id), {
        isActive: !category.isActive,
      });
      if (res.data.success) {
        toast.success(
          `Category ${!category.isActive ? "activated" : "deactivated"} successfully.`,
        );
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle status.");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
            <ListIcon className="h-6 w-6 text-primary" /> Categories Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organize products and control category availability across the
            marketplace.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto font-bold flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" /> Create Category
        </Button>
      </div>

      <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search categories by name..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={loading}
            className="w-full sm:w-auto font-medium"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ListIcon className="h-4 w-4 mr-2" />
            )}
            Refresh List
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
            <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
            <p className="text-sm font-semibold">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-75 text-zinc-500 bg-zinc-50/30">
            <ListIcon className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="font-bold text-zinc-700">No categories found</p>
            <p className="text-sm text-zinc-400">
              Create your first category or adjust your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Parent Category</th>
                  <th className="px-6 py-4">Product Count</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-zinc-800">
                          {category.name}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          /{category.slug}
                        </p>
                        {category.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">
                      {category.parent ? category.parent.name : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-700">
                        <PackageIcon className="h-4 w-4 text-zinc-400" />
                        {category._count.products}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                          category.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {category.isActive ? (
                          <>
                            <ToggleRightIcon className="h-4 w-4" /> Active
                          </>
                        ) : (
                          <>
                            <ToggleLeftIcon className="h-4 w-4" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-800 bg-white"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <PencilSimpleIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(category)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isDialogOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-800">
                {dialogMode === "create"
                  ? "Create New Category"
                  : "Edit Category"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Categories allow sellers to classify their products effectively.
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              <form
                id="category-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Category Name *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="e.g. Electronics"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    className="flex min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    placeholder="Brief description of what goes in this category..."
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) => updateForm("parentId", e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10 focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">None (Top-Level)</option>
                    {categories
                      .filter((c) => c.id !== currentCategoryId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50">
                  <div>
                    <p className="font-bold text-sm text-zinc-800">Status</p>
                    <p className="text-xs text-zinc-500">
                      Should this category be visible to sellers?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateForm("isActive", !form.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                      form.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                    }`}
                  >
                    {form.isActive ? (
                      <>
                        <ToggleRightIcon className="h-4 w-4" /> Active
                      </>
                    ) : (
                      <>
                        <ToggleLeftIcon className="h-4 w-4" /> Inactive
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button form="category-form" type="submit" disabled={submitting}>
                {submitting ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : dialogMode === "create" ? (
                  "Create Category"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
