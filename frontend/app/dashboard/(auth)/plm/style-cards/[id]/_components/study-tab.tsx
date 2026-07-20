"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { plmApi } from "@/lib/nexuscore-api";
import { getCurrentUser } from "@/lib/auth";
import { GridInput, uid, num } from "./grid-input";

type StudyLine = { id: string; processCardId: string; sequence: number; standardTime: number; resourceCardId: string; employeeCardId: string; notes: string };

export function StudyTab({ styleCardId, card }: { styleCardId: string; card: any; onReloadCard: () => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [lines, setLines] = useState<StudyLine[]>([]);
  const [processCards, setProcessCards] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [tpls, pc, rc, ec] = await Promise.all([
        plmApi.studyTemplates.list({ styleCardId }),
        plmApi.processCards.list().catch(() => ({ data: [] })),
        plmApi.resources.list().catch(() => ({ data: [] })),
        plmApi.employees.list().catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(tpls) ? tpls : (tpls as any)?.data || [];
      setTemplates(list);
      setProcessCards(Array.isArray(pc) ? pc : (pc as any)?.data || []);
      setResources(Array.isArray(rc) ? rc : (rc as any)?.data || []);
      setEmployees(Array.isArray(ec) ? ec : (ec as any)?.data || []);
      if (list.length && !selectedId) selectTemplate(list[0].id, list);
    } catch (e: any) {
      toast.error(e.message || "Failed to load study templates");
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = async (id: string, list?: any[]) => {
    setSelectedId(id);
    const tpl = (list || templates).find((t) => t.id === id);
    setLines((tpl?.lines || []).map((l: any) => ({
      id: l.id, processCardId: l.processCardId || "", sequence: l.sequence ?? 0, standardTime: num(l.standardTime),
      resourceCardId: l.resourceCardId || "", employeeCardId: l.employeeCardId || "", notes: l.notes || "",
    })));
  };

  useEffect(() => { load(); }, [styleCardId]);

  const createTemplate = async () => {
    if (!newName.trim()) return toast.error("Name required");
    setCreating(true);
    try {
      const user = getCurrentUser();
      const tpl: any = await plmApi.studyTemplates.create({ name: newName, styleCardId, branchId: user?.branchId });
      toast.success("Study template created");
      setNewName("");
      await load();
      selectTemplate(tpl.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const update = (id: string, patch: Partial<StudyLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { id: uid(), processCardId: "", sequence: ls.length + 1, standardTime: 0, resourceCardId: "", employeeCardId: "", notes: "" }]);
  const removeLine = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id));

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await plmApi.studyTemplates.upsertLines(selectedId, lines);
      toast.success("Study lines saved");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save lines");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 flex items-end gap-3">
        {templates.length > 0 && (
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Study Template</label>
            <Select value={selectedId} onValueChange={(v) => selectTemplate(v)}>
              <SelectTrigger className="h-8 text-sm max-w-md"><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">{templates.length ? "New Template Name" : "Create Study Template"}</label>
          <div className="flex gap-1.5">
            <Input className="h-8 text-sm" placeholder="e.g. Sewing Study" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={createTemplate} disabled={creating}><Plus className="h-3.5 w-3.5 mr-1" />Create</Button>
          </div>
        </div>
      </div>

      {selectedId && (
        <div>
          <div className="flex justify-end mb-1.5">
            <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:border-r [&>th]:text-[11px] [&>th]:h-8">
                  <TableHead className="text-right w-16">Seq</TableHead>
                  <TableHead className="min-w-[180px]">Process</TableHead>
                  <TableHead className="text-right">Standard Time</TableHead>
                  <TableHead className="min-w-[160px]">Resource</TableHead>
                  <TableHead className="min-w-[160px]">Employee</TableHead>
                  <TableHead className="min-w-[160px]">Notes</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.id} className="[&>td]:border-r [&>td]:p-0">
                    <TableCell><GridInput type="number" align="right" value={l.sequence} onChange={(v) => update(l.id, { sequence: parseInt(v) || 0 })} /></TableCell>
                    <TableCell className="p-1">
                      <select value={l.processCardId} onChange={(e) => update(l.id, { processCardId: e.target.value })} className="h-7 w-full text-xs bg-transparent outline-none rounded focus:bg-accent/50">
                        <option value="">Select process</option>
                        {processCards.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell><GridInput type="number" align="right" value={l.standardTime} onChange={(v) => update(l.id, { standardTime: parseFloat(v) || 0 })} /></TableCell>
                    <TableCell className="p-1">
                      <select value={l.resourceCardId} onChange={(e) => update(l.id, { resourceCardId: e.target.value })} className="h-7 w-full text-xs bg-transparent outline-none rounded focus:bg-accent/50">
                        <option value="">—</option>
                        {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="p-1">
                      <select value={l.employeeCardId} onChange={(e) => update(l.id, { employeeCardId: e.target.value })} className="h-7 w-full text-xs bg-transparent outline-none rounded focus:bg-accent/50">
                        <option value="">—</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell><GridInput value={l.notes} onChange={(v) => update(l.id, { notes: v })} /></TableCell>
                    <TableCell className="p-0 text-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(l.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" size="sm" className="mt-1.5 h-7 text-xs" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" />Add Row</Button>
        </div>
      )}
    </div>
  );
}
