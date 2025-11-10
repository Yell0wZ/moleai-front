import React, { useCallback, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Building2, RefreshCcw, Sparkles, LogOut, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";

import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/components/common/LanguageProvider";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lordicon } from "@/components/ui/lordicon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ProfilePage({ businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const { user, logout } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: null,
    businesses: [],
    usage: null,
    lastUpdated: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchProfileData = useCallback(
    async (showFullLoading = false) => {
      if (!user?.uid) {
        setState({
          loading: false,
          error: t("profile.missingUser"),
          businesses: [],
          usage: null,
          lastUpdated: null,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: showFullLoading || prev.businesses.length === 0,
        error: null,
      }));

      if (!showFullLoading) {
        setIsRefreshing(true);
      }

      try {
        const clientRef = doc(db, "clients", user.uid);
        const businessesRef = collection(clientRef, "businesses");

        const [clientSnapshot, businessesSnapshot] = await Promise.all([
          getDoc(clientRef),
          getDocs(businessesRef).catch((error) => {
            console.warn("Unable to load businesses sub-collection:", error);
            return null;
          }),
        ]);

        const businessMap = new Map();
        let usageData = null;
        let fallbackCounter = 0;

        const nextFallbackId = (source = "inline") => {
          fallbackCounter += 1;
          return `${source}-business-${fallbackCounter}`;
        };

        const normalizeBusiness = (raw, fallbackId, overrides = {}) => {
          if (!raw) {
            return null;
          }

          let data = raw;
          let baseId = fallbackId;

          if (raw && typeof raw.data === "function") {
            baseId = raw.id || fallbackId;
            data = raw.data();
          }

          if (typeof data === "string") {
            return {
              id: baseId || data || nextFallbackId(overrides.source),
              name: data,
              industry: "",
              description: "",
              website: "",
              phone: "",
              ...overrides,
            };
          }

          if (typeof data !== "object") {
            return null;
          }

          const name =
            data.business_name ||
            data.businessName ||
            data.name ||
            data.title ||
            baseId ||
            t("welcome.profile.businessFallbackName");

          const normalizedId =
            (data.id || data.uid || baseId || name || nextFallbackId(overrides.source)).toString();

          return {
            id: normalizedId,
            name,
            industry: data.industry || "",
            description:
              data.description ||
              data.businessDescription ||
              data.summary ||
              data.bio ||
              "",
            website: data.website || data.site || "",
            phone: data.phone || data.phoneNumber || "",
            createdAt: toDate(data.createdAt || data.created_at || data.created_date),
            updatedAt: toDate(data.updatedAt || data.updated_at || data.updated_date),
            ...overrides,
          };
        };

        const mergeBusiness = (business) => {
          if (!business) {
            return;
          }

          const existing = businessMap.get(business.id);

          if (existing) {
            businessMap.set(business.id, {
              ...existing,
              ...business,
              isPrimary: existing.isPrimary || business.isPrimary || false,
              source: existing.isPrimary ? existing.source : business.source,
            });
          } else {
            businessMap.set(business.id, business);
          }
        };

        if (clientSnapshot.exists()) {
          const clientData = clientSnapshot.data() || {};
          
          // Save raw database data for download
          console.log('Saving raw database data:', clientData);
          console.log('Client data keys:', Object.keys(clientData || {}));
          setState(prev => {
            console.log('Previous state:', prev);
            const newState = {
              ...prev,
            };
            console.log('New state:', newState);
            return newState;
          });


          usageData =
            clientData.usage ||
            clientData.usageStats ||
            clientData.usage_statistics ||
            null;

          const primaryBusinessData =
            clientData.businessProfile || clientData.business_profile || null;

          mergeBusiness(
            normalizeBusiness(primaryBusinessData, `${clientSnapshot.id}-primary`, {
              source: "primary",
              isPrimary: true,
            })
          );

          // Load secondary businesses from the correct field
          const secondaryBusinesses = clientData.secondary_buisness || clientData.secondary_business || [];

          if (Array.isArray(secondaryBusinesses)) {
            secondaryBusinesses.forEach((business, index) => {
              mergeBusiness(
                normalizeBusiness(business, `${clientSnapshot.id}-secondary-${index}`, {
                  source: "secondary",
                  isPrimary: false,
                })
              );
            });
          }

          // Also check for legacy inline businesses
          const inlineBusinesses = clientData.businesses || clientData.business_list;

          if (Array.isArray(inlineBusinesses)) {
            inlineBusinesses.forEach((business, index) => {
              mergeBusiness(
                normalizeBusiness(business, `${clientSnapshot.id}-list-${index}`, {
                  source: "inline",
                })
              );
            });
          } else if (inlineBusinesses && typeof inlineBusinesses === "object") {
            Object.entries(inlineBusinesses).forEach(([key, value]) => {
              mergeBusiness(
                normalizeBusiness(value, key || nextFallbackId("inline"), {
                  source: "inline",
                })
              );
            });
          }
        }

        if (businessesSnapshot && !businessesSnapshot.empty) {
          businessesSnapshot.forEach((businessDoc) => {
            mergeBusiness(
              normalizeBusiness(businessDoc, businessDoc.id, {
                source: "collection",
              })
            );
          });
        }

        const businesses = Array.from(businessMap.values()).sort((a, b) => {
          if (a.isPrimary === b.isPrimary) {
            return a.name.localeCompare(b.name);
          }
          return a.isPrimary ? -1 : 1;
        });


        setState({
          loading: false,
          error: null,
          businesses,
          usage: usageData,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error("Failed to load profile overview:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: t("profile.loadingError"),
        }));
      } finally {
        setIsRefreshing(false);
      }
    },
    [t, user?.uid]
  );

  useEffect(() => {
    fetchProfileData(true);
  }, [fetchProfileData]);

  const handleRefresh = () => {
    // Prevent double-clicking
    if (loading || isRefreshing) {
      return;
    }
    fetchProfileData(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const { loading, error, businesses, usage } = state;

  const remainingPrompts = Math.max(
    0,
    (usage?.maxPrompts ?? 0) - (usage?.monthlyPrompts ?? 0)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Lordicon size="lg" variant="primary" />

      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 pt-12 md:pt-6 md:pl-8 max-w-5xl mx-auto space-y-6 profile-page-desktop-shift laptop-spacing laptop-lg-spacing desktop-spacing desktop-lg-spacing ${isRTL ? "text-right" : ""}`}>
      <PageHeader
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        isRTL={isRTL}
        showOnMobile={false}
        actions={
          user?.uid ? (
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2 text-white shadow-md transition hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                {isRefreshing ? (
                  <Lordicon size="sm" variant="white" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                <span>{isRefreshing ? (isHebrew ? "טוען..." : "Loading...") : (isHebrew ? "רענן" : "Refresh")}</span>
              </Button>
            </div>
          ) : null
        }
      />

      {error && (
        <Card className="border border-red-100 bg-red-50/70 text-red-700">
          <CardContent className="flex flex-col gap-3 py-6">
            <span>{error}</span>
            {user?.uid && (
              <Button
                variant="outline"
                onClick={() => fetchProfileData(true)}
                className={`self-start border-red-300 text-red-700 hover:bg-red-100 ${
                  isRTL ? "self-end" : ""
                }`}
              >
                {t("profile.retry")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className={`${isRTL ? "text-right" : ""}`}>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                <Building2 className="h-5 w-5" />
              </span>
              {t("profile.businessesSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businesses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                {t("profile.businessesEmpty")}
              </div>
            ) : (
              <div className="space-y-6">

                {businesses.filter(b => b.isPrimary).length > 0 && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="h-px bg-gradient-to-r from-sky-500/30 to-transparent flex-1"></div>
                      <h3 className="text-sm font-semibold text-sky-600 uppercase tracking-wide">
                        {t("profile.primaryBusinessSection")}
                      </h3>
                      <div className="h-px bg-gradient-to-l from-sky-500/30 to-transparent flex-1"></div>
                    </div>
                    {businesses.filter(b => b.isPrimary).map((business) => (
                      <motion.div
                        key={business.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/50 to-white p-5 shadow-sm"
                      >
                        <div
                          className={`flex flex-col gap-3 ${
                            isRTL ? "items-end text-right" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {business.name}
                            </h3>
                            <Badge className="bg-sky-500/90 text-white shadow-sm">
                              {t("profile.primaryLabel")}
                            </Badge>
                          </div>

                          {business.industry && (
                            <p className="text-sm text-slate-500">
                              {business.industry}
                            </p>
                          )}

                          {business.description && (
                            <p className="text-sm leading-relaxed text-slate-600">
                              {business.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            {business.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-sky-500" />
                                {business.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}


                {businesses.filter(b => !b.isPrimary).length > 0 && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="h-px bg-gradient-to-r from-emerald-500/30 to-transparent flex-1"></div>
                      <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                        {t("profile.secondaryBusinessesSection")}
                      </h3>
                      <div className="h-px bg-gradient-to-l from-emerald-500/30 to-transparent flex-1"></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {businesses.filter(b => !b.isPrimary).map((business) => (
                        <motion.div
                          key={business.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div
                            className={`flex flex-col gap-3 ${
                              isRTL ? "items-end text-right" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {business.name}
                              </h3>
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                {t("profile.additionalLabel")}
                              </Badge>
                            </div>

                            {business.industry && (
                              <p className="text-sm text-slate-500">
                                {business.industry}
                              </p>
                            )}

                            {business.description && (
                              <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                                {business.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                              {business.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-emerald-500" />
                                  {business.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className={`${isRTL ? "text-right" : ""}`}>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              {t("profile.usageSection")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usage ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <UsageStat
                    label={t("profile.maxPrompts")}
                    value={usage.maxPrompts ?? 0}
                  />
                  <UsageStat
                    label={t("profile.monthlyPrompts")}
                    value={usage.monthlyPrompts ?? 0}
                  />
                  <UsageStat
                    label={t("profile.totalPrompts")}
                    value={usage.totalPrompts ?? 0}
                  />
                  <UsageStat
                    label={t("profile.remainingPrompts")}
                    value={remainingPrompts}
                  />
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
                  {t("analytics.noDataMessage")}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                {t("profile.noUsage")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className={`${isRTL ? "text-right" : ""}`}>
          <CardTitle className="text-lg font-semibold text-slate-900">
            {isHebrew ? "הגדרות חשבון" : "Account Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              variant="destructive"
              className="inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" />
              {isHebrew ? "התנתק" : "Disconnect"}
            </Button>
          </div>
        </CardContent>
      </Card>


      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="hidden sm:inline">
                  {isHebrew ? "האם אתה בטוח שברצונך להתנתק?" : "Are you sure you want to disconnect?"}
                </span>
                <span className="sm:hidden">
                  {isHebrew ? "התנתקות?" : "Disconnect?"}
                </span>
              </DialogTitle>
              <DialogClose asChild>
                <button
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-slate-600">
              {isHebrew 
                ? "תתנתק מהחשבון שלך ותועבר למסך הכניסה." 
                : "You will be logged out of your account and redirected to the login screen."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="h-12 sm:h-12 px-4 sm:px-6 text-base text-slate-500 hover:text-slate-700 flex-1 sm:flex-none"
            >
              {isHebrew ? "ביטול" : "Cancel"}
            </Button>
            <Button
              onClick={handleLogout}
              className="h-12 sm:h-12 px-4 sm:px-6 text-base bg-sky-600 hover:bg-sky-700 text-white flex-1 sm:flex-none"
            >
              {isHebrew ? "התנתק" : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function UsageStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
