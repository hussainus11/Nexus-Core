"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Download, Eye, Lock, FileText, AlertCircle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_NEXUSCORE_API_URL || 'http://localhost:4000/api/v1';

const ITEM_STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
  uploaded: <div className="h-4 w-4 rounded-full bg-blue-400 shrink-0" />,
  in_review: <div className="h-4 w-4 rounded-full bg-amber-400 shrink-0" />,
};

export default function SharedDocketPage() {
  const { token } = useParams() as { token: string };
  const [state, setState] = useState<"loading" | "password" | "loaded" | "error">("loading");
  const [docket, setDocket] = useState<any>(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const fetchDocket = async (pwd?: string) => {
    try {
      const url = pwd
        ? `${BASE}/public/dockets/${token}?password=${encodeURIComponent(pwd)}`
        : `${BASE}/public/dockets/${token}`;
      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
        // Password required or wrong password
        const data = await res.json().catch(() => ({}));
        if (data?.requiresPassword || data?.message?.includes("password")) {
          setState("password");
          if (pwd) setPasswordError("Incorrect password. Please try again.");
        } else {
          setError(data?.message || "You do not have access to this docket.");
          setState("error");
        }
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "This link may have expired or is invalid.");
        setState("error");
        return;
      }
      const json = await res.json();
      const data = json?.data ?? json;
      setDocket(data);
      setState("loaded");
    } catch {
      setError("Unable to load docket. Please check your connection.");
      setState("error");
    }
  };

  useEffect(() => {
    fetchDocket();
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setPasswordError("Password is required"); return; }
    setUnlocking(true);
    setPasswordError("");
    await fetchDocket(password);
    setUnlocking(false);
  };

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading docket...</p>
        </div>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Unavailable</h1>
          <p className="text-gray-500 text-sm">{error}</p>
          <p className="text-xs text-gray-400 mt-6">Powered by NexusCore</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (state === "password") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl border shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-3">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Password Protected</h1>
            <p className="text-sm text-gray-500 mt-1">This docket is password protected. Enter the password to view.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
            </div>
            <button
              type="submit"
              disabled={unlocking}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {unlocking ? "Verifying..." : "Unlock Docket"}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-6">Powered by NexusCore</p>
        </div>
      </div>
    );
  }

  // Loaded — show docket
  if (!docket) return null;

  const items = docket.items ?? [];
  const sharedBy = docket.sharedBy ?? docket.company?.name ?? "NexusCore";
  const expiresAt = docket.expiresAt ?? docket.shareLink?.expiresAt;
  const accessType = docket.accessType ?? "view";

  // Group items by category
  const grouped: Record<string, any[]> = {};
  for (const item of items) {
    const cat = item.documentTypeCard?.category ?? "documents";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">NexusCore</p>
              <p className="text-sm font-semibold text-gray-900">{docket.docketNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Shared by</p>
            <p className="text-sm font-medium text-gray-700">{sharedBy}</p>
          </div>
        </div>
      </div>

      {/* Docket title */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{docket.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {items.filter((i: any) => i.status === 'approved').length} of {items.length} documents available
        </p>

        {/* Documents grouped by category */}
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => {
            const approvedItems = catItems.filter((i: any) => i.status === 'approved');
            if (approvedItems.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  {category.replace("_", " ")}
                </h2>
                <div className="space-y-2">
                  {approvedItems.map((item: any) => {
                    const latestDoc = item.latestDocument ?? item.documents?.[0];
                    return (
                      <div key={item.id} className="bg-white rounded-lg border px-4 py-3 flex items-center gap-3">
                        {ITEM_STATUS_ICON[item.status] ?? <div className="h-4 w-4 rounded-full bg-gray-300 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.title ?? item.documentTypeCard?.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {latestDoc && <span className="text-xs text-gray-400">v{latestDoc.version}</span>}
                            {item.approvedAt && <span className="text-xs text-gray-400">Approved {new Date(item.approvedAt).toLocaleDateString()}</span>}
                            {latestDoc?.fileName && <span className="text-xs text-gray-400 truncate">{latestDoc.fileName}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {latestDoc?.fileUrl && (
                            <>
                              <a
                                href={latestDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />View
                              </a>
                              {accessType === "download" && (
                                <a
                                  href={latestDoc.fileUrl}
                                  download={latestDoc.fileName}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />Download
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-4 pb-8 mt-8 text-center border-t pt-6">
        <p className="text-xs text-gray-400">
          {expiresAt && `This link expires on ${new Date(expiresAt).toLocaleDateString()} · `}
          Powered by <span className="font-semibold">NexusCore</span>
        </p>
        {docket.watermark && (
          <p className="text-xs text-gray-300 mt-1">Confidential — shared with {docket.sharedWith}</p>
        )}
      </div>
    </div>
  );
}
