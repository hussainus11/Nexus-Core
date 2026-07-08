"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

const STATUSES = ['draft', 'submitted', 'in-review', 'fit-trial', 'revision', 'approved', 'rejected', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  'fit-trial': 'bg-purple-100 text-purple-700', revision: 'bg-amber-100 text-amber-700',
};

const StatusIcon = ({ s }: { s: string }) => {
  if (s === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

export default function SampleCardDetailPage() {
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
    try { const r = await plmApi.sampleCards.get(id); setCard(r); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const changeStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      const user = getCurrentUser();
      await plmApi.sampleCards.changeStatus(id, { status: newStatus, note: statusNote, changedBy: user?.id });
      toast.success("Status updated");
      setStatusDialog(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!card) return <div className="p-6 text-muted-foreground">Sample card not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{card.sampleNumber}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[card.status] || 'bg-gray-100 text-gray-700'}`}>{card.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">{card.styleCard?.title} · {card.sampleType?.name} · {card.colorway || card.title || ''}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { setNewStatus(card.status); setStatusNote(''); setStatusDialog(true); }}>Change Status</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History ({card.history?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="tasks">BPM Tasks ({card.bpmTasks?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Status</p><p className="font-medium capitalize">{card.status}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Due Date</p><p className="font-medium">{card.dueDate ? new Date(card.dueDate).toLocaleDateString() : '—'}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Colorway</p><p className="font-medium">{card.colorway || '—'}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Cost</p><p className="font-medium">{card.cost ? `${card.currency} ${card.cost}` : '—'}</p></CardContent></Card>
          </div>
          {card.notes && <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{card.notes}</p></CardContent></Card>}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <div className="space-y-2">
            {!card.history?.length ? <p className="text-center py-6 text-muted-foreground">No history yet</p>
              : card.history.map((h: any, i: number) => {
                const status = h.toStatus || h.status || h.action;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <StatusIcon s={status} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {h.fromStatus && <span className="text-xs text-muted-foreground">{h.fromStatus} →</span>}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</span>
                      </div>
                      {h.notes && <p className="text-sm mt-1">{h.notes}</p>}
                      {h.changedBy && <p className="text-xs text-muted-foreground mt-1">by {h.changedBy}</p>}
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Stage</TableHead><TableHead>Assignee</TableHead><TableHead>Status</TableHead><TableHead>Due</TableHead></TableRow></TableHeader>
              <TableBody>
                {!card.bpmTasks?.length ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No tasks yet</TableCell></TableRow>
                  : card.bpmTasks.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.stage?.name || '—'}</TableCell>
                      <TableCell>{t.assignedTo || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                      <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
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
            <div><Label>Note</Label><Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button><Button onClick={changeStatus} disabled={saving}>Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
