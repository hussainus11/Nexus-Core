"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, Search, ExternalLink } from "lucide-react";

const STATUSES = ['draft', 'submitted', 'in-review', 'fit-trial', 'revision', 'approved', 'rejected', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  'fit-trial': 'bg-purple-100 text-purple-700', revision: 'bg-amber-100 text-amber-700',
};

const empty = { styleCardId: '', sampleTypeId: '', title: '', colorway: '', dueDate: '', notes: '' };

export default function SampleCardsPage() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [styleCards, setStyleCards] = useState<any[]>([]);
  const [sampleTypes, setSampleTypes] = useState<any[]>([]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q: any = { page: String(page), limit: '20' };
      if (search) q.search = search;
      if (status) q.status = status;
      const r: any = await plmApi.sampleCards.list(q);
      setData(r?.data ?? []);
      setMeta(r?.meta ?? { total: 0, page: 1, pages: 1 });
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([plmApi.styleCards.list({ limit: '200' }), plmApi.sampleTypes.list()]).then(([sc, st]: any) => {
      setStyleCards(sc?.data ?? []);
      setSampleTypes(Array.isArray(st) ? st : []);
    });
  }, []);

  const save = async () => {
    if (!form.styleCardId || !form.sampleTypeId || !form.title) return toast.error("Style card, sample type, and title required");
    setSaving(true);
    try {
      const user = getCurrentUser();
      await plmApi.sampleCards.create({ ...form, createdBy: user?.id });
      toast.success("Sample card created");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Sample Cards</h1><p className="text-xs text-muted-foreground">{meta.total} samples total</p></div>
        <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Sample</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search samples..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-56 h-9" /></div>
        <Select value={status || '__all__'} onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Sample #</TableHead><TableHead>Style</TableHead><TableHead>Type</TableHead><TableHead>Title</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sample cards yet</TableCell></TableRow>
            ) : data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{row.sampleNumber}</TableCell>
                <TableCell>{row.styleCard?.title || row.styleCardId}</TableCell>
                <TableCell>{row.sampleType?.name || '—'}</TableCell>
                <TableCell>{row.title || row.colorway || '—'}</TableCell>
                <TableCell>{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</TableCell>
                <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>{row.status}</span></TableCell>
                <TableCell><Link href={`/dashboard/plm/sample-cards/${row.id}`}><ExternalLink className="h-4 w-4 text-muted-foreground" /></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {meta.page} of {meta.pages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => load(meta.page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Sample Card</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Style Card *</Label>
              <Select value={form.styleCardId} onValueChange={(v) => setForm((p: any) => ({ ...p, styleCardId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                <SelectContent>{styleCards.map((s) => <SelectItem key={s.id} value={s.id}>{s.styleNumber} — {s.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Sample Type *</Label>
              <Select value={form.sampleTypeId} onValueChange={(v) => setForm((p: any) => ({ ...p, sampleTypeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{sampleTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Sample reference title" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Colorway</Label><Input value={form.colorway} onChange={(e) => setForm((p: any) => ({ ...p, colorway: e.target.value }))} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((p: any) => ({ ...p, dueDate: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
