"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";

import { GeneralTab } from "./_components/general-tab";
import { MeasurementChartTab } from "./_components/measurement-chart-tab";
import { BomTab } from "./_components/bom-tab";
import { WashCareTab } from "./_components/wash-care-tab";
import { StudyTab } from "./_components/study-tab";
import { ExpensesTab } from "./_components/expenses-tab";
import { OrderInfoTab } from "./_components/order-info-tab";
import { CostTab } from "./_components/cost-tab";
import { CustomizedFieldsTab } from "./_components/customized-fields-tab";

const STATUSES = ['concept', 'design', 'mood-board-review', 'tech-pack', 'sampling', 'sample-review', 'approved', 'production', 'discontinued'];
const STATUS_COLORS: Record<string, string> = {
  concept: 'bg-slate-100 text-slate-700', design: 'bg-blue-100 text-blue-700',
  sampling: 'bg-purple-100 text-purple-700', approved: 'bg-green-100 text-green-700',
  production: 'bg-emerald-100 text-emerald-700', discontinued: 'bg-red-100 text-red-700',
};

export default function StyleCardDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await plmApi.styleCards.get(id);
      setCard(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      const user = getCurrentUser();
      await plmApi.styleCards.changeStatus(id, { status: newStatus, note: statusNote, changedBy: user?.id });
      toast.success("Status updated");
      setStatusDialog(false);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const duplicate = async () => {
    try {
      const created: any = await plmApi.styleCards.duplicate(id);
      toast.success("Style card duplicated");
      router.push(`/dashboard/plm/style-cards/${created.id}`);
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!card) return <div className="p-6 text-muted-foreground">Style card not found.</div>;

  const sampleLabel = card.sampleCards?.[0]?.title;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{card.styleNumber} — {card.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[card.status] || 'bg-gray-100 text-gray-700'}`}>{card.status}</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {sampleLabel ? `${sampleLabel} · ` : ""}{card.season || "—"} {card.year || ""} · {card.gender || "—"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={duplicate}><Copy className="h-4 w-4 mr-1" />Duplicate</Button>
        <Button size="sm" variant="outline" onClick={() => { setNewStatus(card.status); setStatusNote(''); setStatusDialog(true); }}>Change Status</Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="measurementChart">Measurement Chart</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="washCare">Wash & Care</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="orderInfo">Order Info</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="customizedFields">Customized Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-4">
          <GeneralTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="measurementChart" className="pt-4">
          <MeasurementChartTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="bom" className="pt-4">
          <BomTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="washCare" className="pt-4">
          <WashCareTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="study" className="pt-4">
          <StudyTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="expenses" className="pt-4">
          <ExpensesTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="orderInfo" className="pt-4">
          <OrderInfoTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="cost" className="pt-4">
          <CostTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
        <TabsContent value="customizedFields" className="pt-4">
          <CustomizedFieldsTab styleCardId={id} card={card} onReloadCard={load} />
        </TabsContent>
      </Tabs>

      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change Status</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Note</Label><Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} placeholder="Reason for status change..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button><Button onClick={changeStatus} disabled={saving}>Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
