"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Upload, File as FileIcon, ImageOff, X, Plus } from "lucide-react";
import { plmApi } from "@/lib/nexuscore-api";
import { customerApi, uploadApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

const SEASONS = ["SS25", "AW25", "SS26", "AW26", "Resort", "Pre-Fall"];
const GENDERS = ["men", "women", "unisex", "kids", "infant"];

export function GeneralTab({ styleCardId, card, onReloadCard }: { styleCardId: string; card: any; onReloadCard: () => void }) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [swatchCards, setSwatchCards] = useState<any[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colorwaySwatchId, setColorwaySwatchId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      brand: card.brand || "",
      departmentId: card.departmentId || "",
      groupCode: card.groupCode || "",
      groupName: card.groupName || "",
      season: card.season || "",
      gender: card.gender || "",
      category: card.category || "",
      customerId: card.customerId || "",
      customerStyleNo: card.customerStyleNo || "",
      contactPerson: card.contactPerson || "",
      productionMerchandiserId: card.productionMerchandiserId || "",
      productMerchandiserId: card.productMerchandiserId || "",
      garmentWash: card.garmentWash || "",
      garmentDye: card.garmentDye || "",
      designerId: card.designerId || "",
      masterSize: card.masterSize || "",
      sizes: Array.isArray(card.sizes) ? card.sizes : [],
      colorways: Array.isArray(card.colorways) ? card.colorways : [],
      attachments: Array.isArray(card.attachments) ? card.attachments : [],
      explanations: card.explanations || "",
    });
  }, [card]);

  useEffect(() => {
    (async () => {
      try {
        const [deps, emps, custs, swatches] = await Promise.all([
          plmApi.departments.list(),
          plmApi.employees.list(),
          customerApi.getCustomers().catch(() => []),
          plmApi.swatchCards.list().catch(() => ({ data: [] })),
        ]);
        setDepartments(Array.isArray(deps) ? deps : deps?.data || []);
        setEmployees(Array.isArray(emps) ? emps : emps?.data || []);
        setCustomers(Array.isArray(custs) ? custs : custs?.data || []);
        setSwatchCards(Array.isArray(swatches) ? swatches : swatches?.data || []);
      } catch {
        // lookups are best-effort; form still works with free text
      }
    })();
  }, []);

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const addSize = () => {
    const v = sizeInput.trim();
    if (!v) return;
    if (!form.sizes.includes(v)) set({ sizes: [...form.sizes, v] });
    setSizeInput("");
  };
  const removeSize = (v: string) => set({ sizes: form.sizes.filter((s: string) => s !== v) });

  const addColorway = () => {
    if (!colorwaySwatchId) return;
    const sw = swatchCards.find((s) => s.id === colorwaySwatchId);
    if (!sw) return;
    if (form.colorways.some((c: any) => c.swatchCardId === sw.id)) return;
    set({ colorways: [...form.colorways, { swatchCardId: sw.id, colorName: sw.colorName, pantoneCode: sw.pantoneCode }] });
    setColorwaySwatchId("");
  };
  const removeColorway = (swatchCardId: string) => set({ colorways: form.colorways.filter((c: any) => c.swatchCardId !== swatchCardId) });

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const user = getCurrentUser();
      const result = await uploadApi.uploadSingle(file, user?.id as any);
      const url = result.relativePath || result.url || `files/${result.type}/${result.name}`;
      set({ attachments: [...form.attachments, { id: `${Date.now()}`, name: file.name, type: file.type, url }] });
      toast.success("File uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const removeAttachment = (id: string) => set({ attachments: form.attachments.filter((a: any) => a.id !== id) });

  const save = async () => {
    setSaving(true);
    try {
      await plmApi.styleCards.update(styleCardId, {
        ...form,
        departmentId: form.departmentId || null,
        customerId: form.customerId || null,
        productionMerchandiserId: form.productionMerchandiserId || null,
        productMerchandiserId: form.productMerchandiserId || null,
        designerId: form.designerId || null,
      });
      toast.success("Saved");
      onReloadCard();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!form.sizes) return null;

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-7 rounded-md border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Brand</Label>
            <Input className="h-8 text-sm" value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Select value={form.departmentId} onValueChange={(v) => set({ departmentId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Group Code</Label>
            <Input className="h-8 text-sm" value={form.groupCode} onChange={(e) => set({ groupCode: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Group Name</Label>
            <Input className="h-8 text-sm" value={form.groupName} onChange={(e) => set({ groupName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Season</Label>
            <Select value={form.season} onValueChange={(v) => set({ season: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select season" /></SelectTrigger>
              <SelectContent>{SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set({ gender: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Input className="h-8 text-sm" value={form.category} onChange={(e) => set({ category: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Select value={form.customerId} onValueChange={(v) => set({ customerId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Customer Style No</Label>
            <Input className="h-8 text-sm" value={form.customerStyleNo} onChange={(e) => set({ customerStyleNo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Contact Person</Label>
            <Input className="h-8 text-sm" value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Production Merchandiser</Label>
            <Select value={form.productionMerchandiserId} onValueChange={(v) => set({ productionMerchandiserId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employeeNumber} — {e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Product Merchandiser</Label>
            <Select value={form.productMerchandiserId} onValueChange={(v) => set({ productMerchandiserId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employeeNumber} — {e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Garment Wash</Label>
            <Input className="h-8 text-sm" value={form.garmentWash} onChange={(e) => set({ garmentWash: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Garment Dye</Label>
            <Input className="h-8 text-sm" value={form.garmentDye} onChange={(e) => set({ garmentDye: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Designer</Label>
            <Select value={form.designerId} onValueChange={(v) => set({ designerId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employeeNumber} — {e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 space-y-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Attachments</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" />{uploading ? "Uploading..." : "Add Document"}
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
          </CardHeader>
          <CardContent className="space-y-2">
            {!form.attachments.length ? (
              <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground py-4">
                <ImageOff className="h-5 w-5" />
                <p className="text-xs">No attachments yet</p>
              </div>
            ) : (
              form.attachments.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 text-xs border rounded-md px-2 py-1.5">
                  <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{a.name}</span>
                  <button onClick={() => removeAttachment(a.id)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Colorway / Sizes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Master Size</Label>
              <Input className="h-8 text-sm w-32" value={form.masterSize} onChange={(e) => set({ masterSize: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sizes</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {form.sizes.map((s: string) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button onClick={() => removeSize(s)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input className="h-8 text-sm" placeholder="e.g. 2Y" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())} />
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addSize}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Colorways</Label>
              <div className="space-y-1 mb-1.5">
                {form.colorways.map((c: any) => (
                  <div key={c.swatchCardId} className="flex items-center gap-2 text-xs border rounded-md px-2 py-1">
                    <span className="flex-1">{c.colorName}{c.pantoneCode ? ` — ${c.pantoneCode}` : ""}</span>
                    <button onClick={() => removeColorway(c.swatchCardId)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Select value={colorwaySwatchId} onValueChange={setColorwaySwatchId}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select swatch color" /></SelectTrigger>
                  <SelectContent>{swatchCards.map((s) => <SelectItem key={s.id} value={s.id}>{s.colorName}{s.pantoneCode ? ` — ${s.pantoneCode}` : ""}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addColorway}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Explanations</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.explanations} onChange={(e) => set({ explanations: e.target.value })} placeholder="Notes about this style..." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
