"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { CostDetailFormBody, DEFAULT_COST_DETAIL, CostDetailValue } from "../_components/cost-detail-dialog";

export default function CostDetailEntryPage() {
  const router = useRouter();
  const [value, setValue] = useState<CostDetailValue>(DEFAULT_COST_DETAIL);
  const [total, setTotal] = useState(0);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Cost Detail Entry</h1>
        <Button size="sm" onClick={() => toast.success("Cost detail saved")}><Save className="h-4 w-4 mr-1" />Save</Button>
      </div>

      <div className="rounded-md border max-w-3xl overflow-hidden">
        <CostDetailFormBody value={value} setValue={setValue} onTotalChange={setTotal} />
      </div>
    </div>
  );
}
