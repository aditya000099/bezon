import { Card, CardContent, CardFooter, Button } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MegaphoneIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  EyeIcon,
  CursorClickIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import API_ENDPOINTS from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import { logger } from "@/utils/logger";

export const SellerAds: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes] = await Promise.all([
        api.get(API_ENDPOINTS.ads.myCampaigns),
        api.get(API_ENDPOINTS.products.sellerMe),
      ]);

      if (campRes.data.success) {
        setCampaigns(campRes.data.data);
      }
    } catch (err: any) {
      logger.error(err);
      toast.error("Failed to load campaigns data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await api.put(API_ENDPOINTS.ads.updateCampaign(id), {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(`Campaign ${newStatus}`);
        setCampaigns(
          campaigns.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update campaign");
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await api.delete(API_ENDPOINTS.ads.deleteCampaign(id));
      if (res.data.success) {
        toast.success("Campaign deleted");
        setCampaigns(campaigns.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete campaign");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sponsored Ads</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Boost your product visibility
          </p>
        </div>
        <Button onClick={() => navigate("/seller/ads/new")} className="gap-2">
          <PlusIcon weight="bold" /> Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <MegaphoneIcon className="w-16 h-16 text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900">No campaigns yet</h3>
          <p className="text-zinc-500 max-w-sm mt-2 mb-6">
            Create your first sponsored ad campaign to boost your products to
            the top of search results.
          </p>
          <Button onClick={() => navigate("/seller/ads/new")}>
            Start Advertising
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const spentPercent = Math.min(
              100,
              (Number(campaign.totalSpent) / Number(campaign.totalBudget)) *
                100,
            );
            const ctr =
              campaign.totalImpressions > 0
                ? (
                    (campaign.totalClicks / campaign.totalImpressions) *
                    100
                  ).toFixed(2)
                : "0.00";

            return (
              <Card key={campaign.id} className="overflow-hidden flex flex-col">
                <CardContent className="p-0 flex-1">
                  <div className="p-5 flex gap-4 border-b border-zinc-100">
                    <div className="w-20 h-20 rounded-md bg-zinc-100 overflow-hidden shrink-0">
                      {campaign.product.images?.[0]?.url ? (
                        <img
                          src={campaign.product.images[0].url}
                          alt={campaign.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-zinc-900 truncate">
                          {campaign.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                            campaign.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : campaign.status === "paused"
                                ? "bg-amber-100 text-amber-700"
                                : campaign.status === "exhausted"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate mt-1">
                        Product: {campaign.product.title}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <EyeIcon className="w-4 h-4" />{" "}
                          <span>{campaign.totalImpressions} views</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <CursorClickIcon className="w-4 h-4" />{" "}
                          <span>{campaign.totalClicks} clicks</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <span>{ctr}% CTR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-50/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-500">
                        Spend: ₹{Number(campaign.totalSpent).toLocaleString()} /
                        ₹{Number(campaign.totalBudget).toLocaleString()}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {spentPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full ${spentPercent > 90 ? "bg-rose-500" : "bg-primary"}`}
                        style={{ width: `${spentPercent}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">Daily Budget</p>
                        <p className="font-semibold text-zinc-900">
                          ₹{Number(campaign.dailyBudget).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Max CPC Bid</p>
                        <p className="font-semibold text-zinc-900">
                          ₹{Number(campaign.costPerClick).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-between">
                  <div className="text-xs text-zinc-500">
                    {campaign.endDate
                      ? `Ends ${new Date(campaign.endDate).toLocaleDateString()}`
                      : "Runs continuously"}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status !== "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {(campaign.status === "active" ||
                      campaign.status === "paused") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatus(campaign.id, campaign.status)
                        }
                        className="gap-2"
                      >
                        {campaign.status === "active" ? (
                          <>
                            <PauseIcon weight="fill" /> PauseIcon
                          </>
                        ) : (
                          <>
                            <PlayIcon weight="fill" /> Resume
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
