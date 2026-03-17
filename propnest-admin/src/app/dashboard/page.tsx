"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ListingDoc {
  id: string;
  title: string;
  category: string;
  transaction_type: string;
  price: number;
  address: string;
  pincode: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  payment_ref: string;
  payment_screenshot: string;
  payment_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  images: string[];
  description: string;
  user_id: string;
  details: Record<string, unknown>;
}

type Tab = "all" | "pending_payment" | "active" | "rejected";
type View = "dashboard" | "listings" | "analytics" | "revenue";

const TAB_CONFIG: { key: Tab; label: string; color: string }[] = [
  { key: "all", label: "All Listings", color: "bg-blue-600" },
  { key: "pending_payment", label: "Awaiting Approval", color: "bg-amber-500" },
  { key: "active", label: "Live", color: "bg-green-500" },
  { key: "rejected", label: "Rejected", color: "bg-red-500" },
];

const CATEGORY_COLORS: Record<string, string> = {
  house: "#3b82f6",
  land: "#10b981",
  pg: "#f59e0b",
  commercial: "#8b5cf6",
  vehicle: "#ef4444",
  commodity: "#ec4899",
};

const LISTING_FEE = 10;

export default function DashboardPage() {
  const router = useRouter();
  const [allListings, setAllListings] = useState<ListingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<View>("dashboard");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ListingDoc>>({});

  // Auth check
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_auth") !== "true") {
      router.push("/");
    }
  }, [router]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const listingsRef = collection(db, "listings");
      const snap = await getDocs(listingsRef);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ListingDoc);
      docs.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setAllListings(docs);
      if (docs.length === 0) {
        setError("Connected to Firebase successfully, but no listings found in the database.");
      }
    } catch (err: unknown) {
      console.error("Firebase error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError("Firebase error: " + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Send email notification
  async function sendEmailNotification(listing: ListingDoc, action: "approved" | "rejected") {
    if (!listing.owner_email) {
      console.warn("No owner email found for listing:", listing.id);
      alert(`Listing ${action} but no owner email found — email notification was not sent.`);
      return;
    }

    console.log(`Sending ${action} email to ${listing.owner_email} for listing: ${listing.title}`);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: listing.owner_email,
          ownerName: listing.owner_name || "User",
          listingTitle: listing.title,
          action,
          listingId: listing.id,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        console.error("Failed to parse email API response, status:", res.status);
        alert(`Listing ${action} but email API returned invalid response (status ${res.status}). Check server logs.`);
        return;
      }

      if (res.ok && data.success) {
        alert(`✅ Email notification sent to ${listing.owner_email}`);
      } else {
        console.error("Email API error:", data);
        alert(`Listing ${action} but email failed: ${data.error || "Unknown error"}\n\nPlease check:\n1. GMAIL_APP_PASSWORD is set in .env.local\n2. 2-Step Verification is enabled on the Gmail account\n3. An App Password (not regular password) is being used`);
      }
    } catch (err) {
      console.error("Email notification network error:", err);
      alert(`Listing ${action} but email notification failed due to network error. Check if the admin server is running.`);
    }
  }

  // Approve listing
  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      await updateDoc(doc(db, "listings", id), {
        status: "active",
        payment_status: "verified",
        payment_verified_at: new Date().toISOString(),
      });
      const listing = allListings.find((l) => l.id === id);
      setAllListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, status: "active", payment_status: "verified" } : l
        )
      );
      // Send approval email
      if (listing) {
        await sendEmailNotification(listing, "approved");
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(null);
    }
  }

  // Reject listing
  async function handleReject(id: string) {
    if (!confirm("Reject this listing? It will be hidden from the main site.")) return;
    setProcessing(id);
    try {
      await updateDoc(doc(db, "listings", id), {
        status: "rejected",
        payment_status: "rejected",
        payment_rejected_at: new Date().toISOString(),
      });
      const listing = allListings.find((l) => l.id === id);
      setAllListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, status: "rejected", payment_status: "rejected" } : l
        )
      );
      // Send rejection email
      if (listing) {
        await sendEmailNotification(listing, "rejected");
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(null);
    }
  }

  // Delete listing
  async function handleDelete(id: string) {
    if (!confirm("DELETE this listing permanently? This cannot be undone.")) return;
    setProcessing(id);
    try {
      await deleteDoc(doc(db, "listings", id));
      setAllListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(null);
    }
  }

  // Edit listing
  function startEdit(listing: ListingDoc) {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      address: listing.address,
      pincode: listing.pincode,
      owner_name: listing.owner_name,
      owner_phone: listing.owner_phone,
      owner_email: listing.owner_email,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setProcessing(editingId);
    try {
      await updateDoc(doc(db, "listings", editingId), {
        ...editForm,
        updated_at: new Date().toISOString(),
      });
      setAllListings((prev) =>
        prev.map((l) =>
          l.id === editingId ? { ...l, ...editForm } : l
        )
      );
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Edit error:", err);
      alert("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(null);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    router.push("/");
  }

  // Compute stats
  const stats = {
    all: allListings.length,
    pending_payment: allListings.filter((l) => l.status === "pending_payment").length,
    active: allListings.filter((l) => l.status === "active").length,
    rejected: allListings.filter((l) => l.status === "rejected").length,
  };

  // Category stats for bar chart
  const categoryStats = Object.entries(
    allListings.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    percentage: allListings.length > 0 ? Math.round((count / allListings.length) * 100) : 0,
    fill: CATEGORY_COLORS[name] || "#6b7280",
  }));

  // Transaction type stats
  const transactionStats = Object.entries(
    allListings.reduce((acc, l) => {
      acc[l.transaction_type] = (acc[l.transaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    percentage: allListings.length > 0 ? Math.round((count / allListings.length) * 100) : 0,
  }));

  // Revenue stats
  const totalRevenue = allListings.filter(
    (l) => l.status === "active" || l.payment_status === "verified"
  ).length * LISTING_FEE;
  const pendingRevenue = allListings.filter(
    (l) => l.status === "pending_payment"
  ).length * LISTING_FEE;
  const totalListingValue = allListings.reduce((sum, l) => sum + (l.price || 0), 0);

  // Filter by tab + search
  const displayed = allListings
    .filter((l) => (tab === "all" ? true : l.status === tab))
    .filter(
      (l) =>
        !search ||
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.owner_phone?.includes(search) ||
        l.payment_ref?.toLowerCase().includes(search.toLowerCase()) ||
        l.category?.toLowerCase().includes(search.toLowerCase()) ||
        l.address?.toLowerCase().includes(search.toLowerCase())
    );

  function statusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Live
          </span>
        );
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Awaiting Approval
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />Rejected
          </span>
        );
      case "sold":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Sold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            {status}
          </span>
        );
    }
  }

  function formatINR(amount: number) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-base font-bold text-white shadow">
              B
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BhoomiTayi Admin</h1>
              <p className="text-xs text-gray-500">Full Control Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchListings}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {(
              [
                { key: "dashboard", label: "Overview" },
                { key: "listings", label: "Listings" },
                { key: "analytics", label: "Analytics" },
                { key: "revenue", label: "Revenue" },
              ] as { key: View; label: string }[]
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  view === v.key
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ====== OVERVIEW VIEW ====== */}
        {view === "dashboard" && (
          <>
            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TAB_CONFIG.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setView("listings"); setTab(t.key); }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                    <p className="text-xs font-medium text-gray-500">{t.label}</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats[t.key]}</p>
                </button>
              ))}
            </div>

            {/* Revenue Summary */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Revenue Collected</p>
                <p className="mt-2 text-3xl font-bold text-green-700">₹{totalRevenue}</p>
                <p className="mt-1 text-xs text-green-600">{stats.active} verified payments</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Revenue</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">₹{pendingRevenue}</p>
                <p className="mt-1 text-xs text-amber-600">{stats.pending_payment} awaiting approval</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Listing Value</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{formatINR(totalListingValue)}</p>
                <p className="mt-1 text-xs text-blue-600">Across {allListings.length} listings</p>
              </div>
            </div>

            {/* Category Chart */}
            {categoryStats.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Listings by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value}`, "Count"]}
                        contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {categoryStats.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3">
                  {categoryStats.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                      {c.name}: {c.count} ({c.percentage}%)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Pending */}
            {stats.pending_payment > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-amber-900">Pending Approvals</h3>
                  <button
                    onClick={() => { setView("listings"); setTab("pending_payment"); }}
                    className="text-xs font-medium text-amber-700 hover:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-2">
                  {allListings
                    .filter((l) => l.status === "pending_payment")
                    .slice(0, 5)
                    .map((l) => (
                      <div key={l.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-amber-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{l.title || "Untitled"}</p>
                          <p className="text-xs text-gray-500">{l.owner_name} · {l.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(l.id)}
                            disabled={processing === l.id}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(l.id)}
                            disabled={processing === l.id}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ====== ANALYTICS VIEW ====== */}
        {view === "analytics" && (
          <>
            <h2 className="mb-6 text-xl font-bold text-gray-900">Analytics Dashboard</h2>

            {/* Category Distribution */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Category Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Count"]}
                      contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {categoryStats.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Percentage Table */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoryStats.map((c) => (
                  <div key={c.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.fill }} />
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-bold text-gray-900">{c.count}</span>
                      <span className="text-sm text-gray-500 mb-0.5">{c.percentage}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${c.percentage}%`, backgroundColor: c.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Type Distribution */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Transaction Types</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Listing Status Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Active/Live", count: stats.active, color: "green", pct: allListings.length > 0 ? Math.round((stats.active / allListings.length) * 100) : 0 },
                  { label: "Pending", count: stats.pending_payment, color: "amber", pct: allListings.length > 0 ? Math.round((stats.pending_payment / allListings.length) * 100) : 0 },
                  { label: "Rejected", count: stats.rejected, color: "red", pct: allListings.length > 0 ? Math.round((stats.rejected / allListings.length) * 100) : 0 },
                  { label: "Sold", count: allListings.filter((l) => l.status === "sold").length, color: "blue", pct: allListings.length > 0 ? Math.round((allListings.filter((l) => l.status === "sold").length / allListings.length) * 100) : 0 },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border border-${s.color}-200 bg-${s.color}-50 p-4`}>
                    <p className={`text-xs font-medium text-${s.color}-600`}>{s.label}</p>
                    <p className={`text-2xl font-bold text-${s.color}-700 mt-1`}>{s.count}</p>
                    <p className={`text-xs text-${s.color}-500 mt-0.5`}>{s.pct}% of total</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== REVENUE VIEW ====== */}
        {view === "revenue" && (
          <>
            <h2 className="mb-6 text-xl font-bold text-gray-900">Revenue & Financial Tracking</h2>

            {/* Revenue Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Total Revenue</p>
                <p className="mt-2 text-4xl font-bold text-green-700">₹{totalRevenue}</p>
                <p className="mt-1 text-sm text-green-600">{stats.active} approved listings × ₹{LISTING_FEE}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Collection</p>
                <p className="mt-2 text-4xl font-bold text-amber-700">₹{pendingRevenue}</p>
                <p className="mt-1 text-sm text-amber-600">{stats.pending_payment} pending × ₹{LISTING_FEE}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Listing Value</p>
                <p className="mt-2 text-4xl font-bold text-blue-700">{formatINR(totalListingValue)}</p>
                <p className="mt-1 text-sm text-blue-600">Combined property value</p>
              </div>
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-5">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Fee per Listing</p>
                <p className="mt-2 text-4xl font-bold text-purple-700">₹{LISTING_FEE}</p>
                <p className="mt-1 text-sm text-purple-600">Standard listing fee</p>
              </div>
            </div>

            {/* Transaction Breakdown */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Revenue by Category</h3>
              <div className="space-y-3">
                {categoryStats.map((c) => {
                  const activeInCategory = allListings.filter(
                    (l) => l.category === c.name.toLowerCase() && (l.status === "active" || l.payment_status === "verified")
                  ).length;
                  const categoryRevenue = activeInCategory * LISTING_FEE;
                  return (
                    <div key={c.name} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{activeInCategory} approved listings</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">₹{categoryRevenue}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Verified Payments */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Verified Payments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 text-xs font-medium text-gray-500">Listing</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Owner</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Category</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Amount</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allListings
                      .filter((l) => l.status === "active" || l.payment_status === "verified")
                      .slice(0, 20)
                      .map((l) => (
                        <tr key={l.id} className="border-b border-gray-50">
                          <td className="py-2.5 font-medium text-gray-900 max-w-[200px] truncate">{l.title}</td>
                          <td className="py-2.5 text-gray-600">{l.owner_name}</td>
                          <td className="py-2.5 capitalize text-gray-600">{l.category}</td>
                          <td className="py-2.5 font-semibold text-green-700">₹{LISTING_FEE}</td>
                          <td className="py-2.5 text-gray-500">
                            {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {allListings.filter((l) => l.status === "active" || l.payment_status === "verified").length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">No verified payments yet</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ====== LISTINGS VIEW ====== */}
        {view === "listings" && (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TAB_CONFIG.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    tab === t.key
                      ? "border-gray-900 bg-white shadow-md ring-1 ring-gray-900"
                      : "border-gray-200 bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                    <p className="text-xs font-medium text-gray-500">{t.label}</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats[t.key]}</p>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Search by title, name, phone, reference, category, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-green-600 border-t-transparent" />
                <p className="mt-4 text-sm text-gray-500">Fetching listings...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24">
                <p className="text-lg font-semibold text-gray-700">No listings found</p>
                <p className="mt-1 text-sm text-gray-500">
                  {tab === "all" ? "No listings in the database yet." : `No listings with status "${tab}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((listing) => {
                  const isExpanded = expandedId === listing.id;
                  const isEditing = editingId === listing.id;
                  return (
                    <div key={listing.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                      {/* Main row */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition"
                        onClick={() => { setExpandedId(isExpanded ? null : listing.id); if (isEditing) { setEditingId(null); setEditForm({}); } }}
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No img</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">{listing.title || "Untitled"}</h3>
                            {statusBadge(listing.status)}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500 truncate">
                            {listing.category} · {listing.owner_name} · {listing.owner_phone}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-bold text-gray-900">₹{listing.price?.toLocaleString("en-IN")}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <div className="shrink-0 text-gray-400">
                          <svg className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {isEditing ? (
                            /* Edit Form */
                            <div className="p-5 space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900">Edit Listing</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={editForm.title || ""}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                  <input
                                    type="number"
                                    value={editForm.price || ""}
                                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Owner Name</label>
                                  <input
                                    type="text"
                                    value={editForm.owner_name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Owner Phone</label>
                                  <input
                                    type="text"
                                    value={editForm.owner_phone || ""}
                                    onChange={(e) => setEditForm({ ...editForm, owner_phone: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Owner Email</label>
                                  <input
                                    type="email"
                                    value={editForm.owner_email || ""}
                                    onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                                  <input
                                    type="text"
                                    value={editForm.pincode || ""}
                                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                                  <input
                                    type="text"
                                    value={editForm.address || ""}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                  <textarea
                                    value={editForm.description || ""}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => { setEditingId(null); setEditForm({}); }}
                                  className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveEdit}
                                  disabled={processing === listing.id}
                                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processing === listing.id ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Details grid */}
                              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Category</p>
                                  <p className="mt-0.5 text-sm font-medium capitalize">{listing.category}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Transaction</p>
                                  <p className="mt-0.5 text-sm font-medium capitalize">{listing.transaction_type}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Owner</p>
                                  <p className="mt-0.5 text-sm font-medium">{listing.owner_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Phone</p>
                                  <p className="mt-0.5 text-sm font-medium">{listing.owner_phone}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Email</p>
                                  <p className="mt-0.5 text-sm font-medium">{listing.owner_email}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Address</p>
                                  <p className="mt-0.5 text-sm font-medium">{listing.address}, {listing.pincode}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
                                  <p className="mt-0.5 text-sm font-medium">{listing.status}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase">Created</p>
                                  <p className="mt-0.5 text-sm font-medium">
                                    {new Date(listing.created_at).toLocaleString("en-IN")}
                                  </p>
                                </div>
                                {/* Payment Proof Section */}
                                {(listing.payment_ref || listing.payment_screenshot) && (
                                  <div className="sm:col-span-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
                                    <p className="text-xs font-semibold text-amber-800 uppercase flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                                      Payment Proof
                                    </p>
                                    {listing.payment_ref && (
                                      <div>
                                        <p className="text-[10px] text-amber-600 uppercase">UPI Transaction ID / UTR</p>
                                        <p className="font-mono text-sm font-bold text-amber-900 select-all">{listing.payment_ref}</p>
                                      </div>
                                    )}
                                    {listing.payment_screenshot && (
                                      <div>
                                        <p className="text-[10px] text-amber-600 uppercase mb-1">Payment Screenshot</p>
                                        <a href={listing.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                          <img
                                            src={listing.payment_screenshot}
                                            alt="Payment proof"
                                            className="max-h-48 rounded-lg border border-amber-200 object-contain cursor-pointer hover:opacity-80 transition"
                                          />
                                        </a>
                                        <p className="text-[10px] text-amber-500 mt-1">Click to view full size</p>
                                      </div>
                                    )}
                                    {!listing.payment_ref && !listing.payment_screenshot && (
                                      <p className="text-xs text-red-600 font-semibold">No payment proof provided!</p>
                                    )}
                                  </div>
                                )}
                                {!listing.payment_ref && !listing.payment_screenshot && listing.status === "pending_payment" && (
                                  <div className="sm:col-span-2 rounded-lg border-2 border-red-300 bg-red-50 p-3">
                                    <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                      NO PAYMENT PROOF — User did not provide UTR or screenshot. Likely did not pay.
                                    </p>
                                  </div>
                                )}
                                {listing.description && (
                                  <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-400 uppercase">Description</p>
                                    <p className="mt-0.5 text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{listing.description}</p>
                                  </div>
                                )}
                              </div>

                              {/* Images */}
                              {listing.images && listing.images.length > 0 && (
                                <div className="border-t border-gray-100 px-5 py-3">
                                  <p className="mb-2 text-xs font-medium text-gray-400 uppercase">Images ({listing.images.length})</p>
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {listing.images.map((img, i) => (
                                      <img key={i} src={img} alt={`Image ${i + 1}`} className="h-20 w-28 shrink-0 rounded-lg object-cover border" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Action buttons */}
                          {!isEditing && (
                            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
                              <p className="text-xs text-gray-400">ID: {listing.id}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDelete(listing.id)}
                                  disabled={processing === listing.id}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEdit(listing); }}
                                  disabled={processing === listing.id}
                                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                {listing.status !== "rejected" && (
                                  <button
                                    onClick={() => handleReject(listing.id)}
                                    disabled={processing === listing.id}
                                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                )}
                                {listing.status !== "active" && (
                                  <button
                                    onClick={() => handleApprove(listing.id)}
                                    disabled={processing === listing.id}
                                    className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {processing === listing.id ? "Processing..." : "Approve & Publish"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
