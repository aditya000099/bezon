import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@bezon/ui';
import React, { useEffect, useState } from "react";
;
import {
  SpinnerIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldIcon,
  PulseIcon,
  TagIcon,
} from "@phosphor-icons/react";
;
;
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  recommendationProfile: {
    categories: string[];
    searches: string[];
  };
}

export const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [roleCounts, setRoleCounts] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.users.adminList, {
        params: roleFilter !== 'all' ? { role: roleFilter } : {}
      });
      if (res.data.success) {
        setUsers(res.data.data);
        setRoleCounts(res.data.roleCounts);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            Platform UsersIcon
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage user accounts and view behavioral insights.
          </p>
        </div>
      </div>

      {roleCounts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className={`cursor-pointer transition-colors ${roleFilter === 'all' ? 'border-indigo-500 bg-indigo-50/30' : 'hover:border-zinc-300'}`} onClick={() => setRoleFilter('all')}>
            <CardContent className="p-4 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-zinc-900">{roleCounts.total}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Total UsersIcon</span>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-colors ${roleFilter === 'customer' ? 'border-teal-500 bg-teal-50/30' : 'hover:border-zinc-300'}`} onClick={() => setRoleFilter('customer')}>
            <CardContent className="p-4 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-teal-600">{roleCounts.customers}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Customers</span>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-colors ${roleFilter === 'seller' ? 'border-amber-500 bg-amber-50/30' : 'hover:border-zinc-300'}`} onClick={() => setRoleFilter('seller')}>
            <CardContent className="p-4 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-amber-600">{roleCounts.sellers}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Sellers</span>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-colors ${roleFilter === 'delivery' ? 'border-blue-500 bg-blue-50/30' : 'hover:border-zinc-300'}`} onClick={() => setRoleFilter('delivery')}>
            <CardContent className="p-4 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-blue-600">{roleCounts.delivery}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Delivery</span>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-colors ${roleFilter === 'admin' ? 'border-rose-500 bg-rose-50/30' : 'hover:border-zinc-300'}`} onClick={() => setRoleFilter('admin')}>
            <CardContent className="p-4 flex flex-col justify-center items-center">
              <span className="text-xl font-bold text-rose-600">{roleCounts.admins}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Admins</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="MagnifyingGlassIcon users by name or email..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="w-full sm:w-auto font-medium"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UsersIcon className="h-4 w-4 mr-2" />
            )}
            Refresh Directory
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-500" />
            <p className="font-medium">Loading user database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-50/30">
            <UsersIcon className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="font-bold text-zinc-700">No users found</p>
            <p className="text-sm text-zinc-400">
              Try adjusting your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role & Status</th>
                  <th className="px-6 py-4">
                    Recommendation Profile (Top Interests)
                  </th>
                  <th className="px-6 py-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800">{user.name}</p>
                          <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
                            <EnvelopeIcon className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldIcon
                            className={`h-3.5 w-3.5 ${user.role === "admin" ? "text-rose-500" : user.role === "seller" ? "text-amber-500" : "text-zinc-400"}`}
                          />
                          <span className="font-semibold text-zinc-700 capitalize text-xs">
                            {user.role}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 max-w-75">
                        {user.recommendationProfile.categories.length > 0 ||
                        user.recommendationProfile.searches.length > 0 ? (
                          <>
                            {user.recommendationProfile.categories.length >
                              0 && (
                              <div className="flex flex-wrap gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-400 w-16 pt-0.5">
                                  CATEGORIES
                                </span>
                                {user.recommendationProfile.categories.map(
                                  (cat) => (
                                    <span
                                      key={cat}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[10px] font-bold"
                                    >
                                      <TagIcon className="h-2.5 w-2.5" />
                                      {cat}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                            {user.recommendationProfile.searches.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="text-[10px] font-bold text-zinc-400 w-16 pt-0.5">
                                  SEARCHES
                                </span>
                                {user.recommendationProfile.searches.map(
                                  (term) => (
                                    <span
                                      key={term}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold"
                                    >
                                      <MagnifyingGlassIcon className="h-2.5 w-2.5" />
                                      {term}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
                            <PulseIcon className="h-3.5 w-3.5" />
                            No activity data yet
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-500 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
