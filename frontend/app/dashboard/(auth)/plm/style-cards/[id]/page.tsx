"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailForm, setDetailForm] = useState<any>({ designDetailTypeId: '', description: '', notes: '' });
  const [detailTypes, setDetailTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, dt] = await Promise.all([plmApi.styleCards.get(id), plmApi.designDetailTypes.list()]);
      setCard(r);
      setDetailTypes(Array.isArray(dt) ? dt : []);
    } finally { setLoading(false); }
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

  const addDetail = async () => {
    if (!detailForm.designDetailTypeId) return toast.error("Select a detail type");
    setSaving(true);
    try {
      await plmApi.styleCards.addDetail(id, detailForm);
      toast.success("Detail added");
      setDetailOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!card) return <div className="p-6 text-muted-foreground">Style card not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{card.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[card.status] || 'bg-gray-100 text-gray-700'}`}>{card.status}</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{card.styleNumber} · {card.season} {card.year} · {card.gender}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { setNewStatus(card.status); setStatusNote(''); setStatusDialog(true); }}>Change Status</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Design Details ({card.details?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="samples">Samples ({card.sampleCards?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="products">Products ({card.productCards?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Samples</p><p className="text-2xl font-bold">{card._count?.sampleCards ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Products</p><p className="text-2xl font-bold">{card._count?.productCards ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Orders</p><p className="text-2xl font-bold">{card._count?.plmOrders ?? 0}</p></CardContent></Card>
          </div>
          {card.description && <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{card.description}</p></CardContent></Card>}
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setDetailForm({ detailTypeId: '', value: '', notes: '' }); setDetailOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Detail</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Detail Type</TableHead><TableHead>Value</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
              <TableBody>
                {!card.details?.length ? <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No details yet</TableCell></TableRow>
                  : card.details.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.designDetailType?.name || d.designDetailTypeId}</TableCell>
                      <TableCell>{d.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{d.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="samples" className="pt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Sample #</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Factory</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {!card.sampleCards?.length ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No samples yet</TableCell></TableRow>
                  : card.sampleCards.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.sampleNumber}</TableCell>
                      <TableCell>{s.sampleType?.name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                      <TableCell>{s.factory || '—'}</TableCell>
                      <TableCell><Link href={`/dashboard/plm/sample-cards/${s.id}`}><ExternalLink className="h-4 w-4 text-muted-foreground" /></Link></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="pt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Product #</TableHead><TableHead>Color</TableHead><TableHead>Fabric</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {!card.productCards?.length ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No products yet</TableCell></TableRow>
                  : card.productCards.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.productNumber}</TableCell>
                      <TableCell>{p.color || '—'}</TableCell>
                      <TableCell>{p.fabric || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell><Link href={`/dashboard/plm/product-cards/${p.id}`}><ExternalLink className="h-4 w-4 text-muted-foreground" /></Link></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Version</TableHead><TableHead>Uploaded By</TableHead></TableRow></TableHeader>
              <TableBody>
                {<TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">View documents in the <a href="/dashboard/plm/documents" className="underline">Documents</a> page</TableCell></TableRow>}
                  {([] as any[]).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell>{d.documentType || '—'}</TableCell>
                      <TableCell>{d.version || 'v1'}</TableCell>
                      <TableCell>{d.uploadedBy || '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Design Detail</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Detail Type *</Label>
              <Select value={detailForm.designDetailTypeId} onValueChange={(v) => setDetailForm((p: any) => ({ ...p, designDetailTypeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{detailTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Input value={detailForm.description} onChange={(e) => setDetailForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={detailForm.notes} onChange={(e) => setDetailForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button><Button onClick={addDetail} disabled={saving}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
