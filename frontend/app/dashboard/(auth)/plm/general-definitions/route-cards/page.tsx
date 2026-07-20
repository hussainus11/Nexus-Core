"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil } from "lucide-react";

const emptyHeader = { code: "", name: "", accessCode: "", specialCode: "", serviceCode: "", inUse: true };
const emptyLine = { processId: "", explanation: "", unitPrice: "", forex: "", forexRate: "", forexUnitPrice: "", isActive: true };

export default function RouteCardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [headerForm, setHeaderForm] = useState<any>(emptyHeader);
  const [editingCard, setEditingCard] = useState<string | null>(null);

  const [lineOpen, setLineOpen] = useState(false);
  const [lineCardId, setLineCardId] = useState('');
  const [lineForm, setLineForm] = useState<any>(emptyLine);
  const [editingLine, setEditingLine] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      const [c, p] = await Promise.all([plmApi.routeCards.list({ branchId: user?.branchId }), plmApi.processCards.list()]);
      setCards(Array.isArray(c) ? c : []);
      setProcesses(Array.isArray(p) ? p : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveHeader = async () => {
    if (!headerForm.code || !headerForm.name) return toast.error("Code and name required");
    setSaving(true);
    try {
      const user = getCurrentUser();
      const payload = { ...headerForm, branchId: user?.branchId };
      if (editingCard) { await plmApi.routeCards.update(editingCard, payload); toast.success("Updated"); }
      else { await plmApi.routeCards.create(payload); toast.success("Created"); }
      setHeaderOpen(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const deleteCard = async (id: string) => {
    try { await plmApi.routeCards.delete(id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const saveLine = async () => {
    if (!lineForm.processId) return toast.error("Select a process");
    setSaving(true);
    try {
      const payload = {
        processId: lineForm.processId,
        explanation: lineForm.explanation || undefined,
        unitPrice: lineForm.unitPrice ? parseFloat(lineForm.unitPrice) : undefined,
        forex: lineForm.forex || undefined,
        forexRate: lineForm.forexRate ? parseFloat(lineForm.forexRate) : undefined,
        forexUnitPrice: lineForm.forexUnitPrice ? parseFloat(lineForm.forexUnitPrice) : undefined,
        isActive: lineForm.isActive,
      };
      if (editingLine) { await plmApi.routeCards.updateLine(lineCardId, editingLine, payload); toast.success("Line updated"); }
      else { await plmApi.routeCards.addLine(lineCardId, payload); toast.success("Line added"); }
      setLineOpen(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const deleteLine = async (cardId: string, lineId: string) => {
    try { await plmApi.routeCards.deleteLine(cardId, lineId); load(); toast.success("Removed"); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">General Definitions › Route Cards</p><h1 className="text-xl font-semibold">Route Cards</h1></div>
        <Button size="sm" onClick={() => { setHeaderForm(emptyHeader); setEditingCard(null); setHeaderOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Route</Button>
      </div>

      {loading ? <Skeleton className="h-32 w-full" /> : cards.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No route cards yet.</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div key={card.id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30" onClick={() => setExpanded(expanded === card.id ? null : card.id)}>
                <div className="flex items-center gap-2">
                  {expanded === card.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Badge variant="outline">{card.code}</Badge>
                  <span className="font-medium">{card.name}</span>
                  <Badge variant="secondary">{card.lines?.length ?? 0} processes</Badge>
                  <Badge variant={card.inUse ? 'default' : 'secondary'}>{card.inUse ? 'In Use' : 'Inactive'}</Badge>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => { setLineCardId(card.id); setLineForm(emptyLine); setEditingLine(null); setLineOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add Process
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setHeaderForm({ code: card.code, name: card.name, accessCode: card.accessCode || '', specialCode: card.specialCode || '', serviceCode: card.serviceCode || '', inUse: card.inUse }); setEditingCard(card.id); setHeaderOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteCard(card.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {expanded === card.id && (
                <div className="border-t">
                  {!card.lines?.length ? (
                    <p className="text-center py-4 text-sm text-muted-foreground">No processes yet. Add process lines.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Process Code</TableHead><TableHead>Process Name</TableHead><TableHead>Explanation</TableHead>
                            <TableHead>Unit Price</TableHead><TableHead>Forex</TableHead><TableHead>Forex Rate</TableHead><TableHead>Forex Unit Price</TableHead>
                            <TableHead>In Use</TableHead><TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {card.lines.map((line: any) => (
                            <TableRow key={line.id}>
                              <TableCell>{line.process?.code}</TableCell>
                              <TableCell>{line.process?.name}</TableCell>
                              <TableCell>{line.explanation || '—'}</TableCell>
                              <TableCell>{line.unitPrice ?? '0.0000'}</TableCell>
                              <TableCell>{line.forex || '—'}</TableCell>
                              <TableCell>{line.forexRate ?? '0.0000'}</TableCell>
                              <TableCell>{line.forexUnitPrice ?? '0.0000'}</TableCell>
                              <TableCell><Switch checked={line.isActive} onCheckedChange={(v) => plmApi.routeCards.updateLine(card.id, line.id, { isActive: v }).then(load)} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLineCardId(card.id); setLineForm({ processId: line.processId, explanation: line.explanation || '', unitPrice: line.unitPrice ?? '', forex: line.forex || '', forexRate: line.forexRate ?? '', forexUnitPrice: line.forexUnitPrice ?? '', isActive: line.isActive }); setEditingLine(line.id); setLineOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteLine(card.id, line.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={headerOpen} onOpenChange={setHeaderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingCard ? 'Edit' : 'New'} Route Card</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code *</Label><Input value={headerForm.code} onChange={(e) => setHeaderForm((p: any) => ({ ...p, code: e.target.value }))} /></div>
            <div><Label>Name *</Label><Input value={headerForm.name} onChange={(e) => setHeaderForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Access Code</Label><Input value={headerForm.accessCode} onChange={(e) => setHeaderForm((p: any) => ({ ...p, accessCode: e.target.value }))} /></div>
            <div><Label>Special Code</Label><Input value={headerForm.specialCode} onChange={(e) => setHeaderForm((p: any) => ({ ...p, specialCode: e.target.value }))} /></div>
            <div><Label>Service Code</Label><Input value={headerForm.serviceCode} onChange={(e) => setHeaderForm((p: any) => ({ ...p, serviceCode: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={headerForm.inUse} onCheckedChange={(v) => setHeaderForm((p: any) => ({ ...p, inUse: v }))} /><Label>In Use</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHeaderOpen(false)}>Cancel</Button><Button onClick={saveHeader} disabled={saving}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lineOpen} onOpenChange={setLineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingLine ? 'Edit' : 'Add'} Process Line</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Process *</Label>
              <Select value={lineForm.processId} onValueChange={(v) => setLineForm((p: any) => ({ ...p, processId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select process" /></SelectTrigger>
                <SelectContent>{processes.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Explanation</Label><Input value={lineForm.explanation} onChange={(e) => setLineForm((p: any) => ({ ...p, explanation: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Unit Price</Label><Input type="number" step="0.01" value={lineForm.unitPrice} onChange={(e) => setLineForm((p: any) => ({ ...p, unitPrice: e.target.value }))} /></div>
              <div><Label className="text-xs">Forex</Label><Input value={lineForm.forex} onChange={(e) => setLineForm((p: any) => ({ ...p, forex: e.target.value }))} /></div>
              <div><Label className="text-xs">Forex Rate</Label><Input type="number" step="0.0001" value={lineForm.forexRate} onChange={(e) => setLineForm((p: any) => ({ ...p, forexRate: e.target.value }))} /></div>
              <div><Label className="text-xs">Forex Unit Price</Label><Input type="number" step="0.01" value={lineForm.forexUnitPrice} onChange={(e) => setLineForm((p: any) => ({ ...p, forexUnitPrice: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={lineForm.isActive} onCheckedChange={(v) => setLineForm((p: any) => ({ ...p, isActive: v }))} /><Label>In Use</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLineOpen(false)}>Cancel</Button><Button onClick={saveLine} disabled={saving}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
