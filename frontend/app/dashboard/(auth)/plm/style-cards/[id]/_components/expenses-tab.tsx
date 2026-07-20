"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { plmApi } from "@/lib/nexuscore-api";
import { GridInput, uid, num } from "./grid-input";

type ExpenseRow = { id: string; expenseType: string; explanation: string; quantity: number; unitPrice: number; forex: string };

const blankRow = (): ExpenseRow => ({ id: uid(), expenseType: "", explanation: "", quantity: 0, unitPrice: 0, forex: "" });

export function ExpensesTab({ styleCardId }: { styleCardId: string; card: any; onReloadCard: () => void }) {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const lines = await plmApi.styleExpenses.get(styleCardId);
      setRows((Array.isArray(lines) ? lines : []).map((l: any) => ({
        id: l.id, expenseType: l.expenseType || "", explanation: l.explanation || "",
        quantity: num(l.quantity), unitPrice: num(l.unitPrice), forex: l.forex || "",
      })));
    } catch (e: any) {
      toast.error(e.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [styleCardId]);

  const update = (id: string, patch: Partial<ExpenseRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, blankRow()]);
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const total = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);

  const save = async () => {
    setSaving(true);
    try {
      await plmApi.styleExpenses.upsertLines(styleCardId, rows);
      toast.success("Expenses saved");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save expenses");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div>
      <div className="flex justify-end mb-1.5">
        <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:border-r [&>th]:text-[11px] [&>th]:h-8">
              <TableHead className="min-w-[160px]">Expense Type</TableHead>
              <TableHead className="min-w-[200px]">Explanation</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead>Forex</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="[&>td]:border-r [&>td]:p-0">
                <TableCell><GridInput value={r.expenseType} onChange={(v) => update(r.id, { expenseType: v })} /></TableCell>
                <TableCell><GridInput value={r.explanation} onChange={(v) => update(r.id, { explanation: v })} /></TableCell>
                <TableCell><GridInput type="number" align="right" value={r.quantity} onChange={(v) => update(r.id, { quantity: parseFloat(v) || 0 })} /></TableCell>
                <TableCell><GridInput type="number" align="right" value={r.unitPrice} onChange={(v) => update(r.id, { unitPrice: parseFloat(v) || 0 })} /></TableCell>
                <TableCell><GridInput value={r.forex} onChange={(v) => update(r.id, { forex: v })} /></TableCell>
                <TableCell className="text-right font-mono text-xs px-2">{(r.quantity * r.unitPrice).toFixed(2)}</TableCell>
                <TableCell className="p-0 text-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(r.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button></TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/40 font-semibold [&>td]:border-r">
              <TableCell colSpan={5} className="text-right text-xs pr-2">Total</TableCell>
              <TableCell className="text-right font-mono text-xs px-2">{total.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" size="sm" className="mt-1.5 h-7 text-xs" onClick={addRow}><Plus className="h-3.5 w-3.5 mr-1" />Add Row</Button>
    </div>
  );
}
