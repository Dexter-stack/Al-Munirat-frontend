import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  reference: z.string().min(1, "Reference is required"),
  receipt: z
    .instanceof(File, { message: "Upload your receipt" })
    .refine((f) => ACCEPTED_TYPES.includes(f.type), "Only JPG, PNG, or PDF files are accepted")
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be smaller than 10MB"),
});

export type ReceiptUploadValues = z.infer<typeof schema>;

interface ReceiptUploadFormProps {
  onSubmit: (values: ReceiptUploadValues, onProgress: (percent: number) => void) => Promise<unknown>;
  isSubmitting: boolean;
  defaultValues?: Partial<Pick<ReceiptUploadValues, "amount" | "reference">>;
}

export function ReceiptUploadForm({ onSubmit, isSubmitting, defaultValues }: ReceiptUploadFormProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceiptUploadValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => onSubmit(values, setProgress))}
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">{t("payment.amount")}</Label>
          <Input id="amount" type="number" step="0.01" className="h-11 rounded-xl bg-slate-50" {...register("amount")} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">{t("payment.paymentDate")}</Label>
          <Input id="payment_date" type="date" className="h-11 rounded-xl bg-slate-50" {...register("payment_date")} />
          {errors.payment_date && <p className="text-xs text-destructive">{errors.payment_date.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reference">{t("payment.reference")}</Label>
        <Input id="reference" className="h-11 rounded-xl bg-slate-50" {...register("reference")} />
        {errors.reference && <p className="text-xs text-destructive">{errors.reference.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receipt">{t("payment.receiptFile")}</Label>
        <Controller
          control={control}
          name="receipt"
          render={({ field: { onChange, value, ...field } }) => (
            <label
              htmlFor="receipt"
              className={cn(
                "group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/20",
              )}
            >
              <MaterialIcon name="cloud_upload" className="text-3xl text-brand-600 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold text-slate-800">
                {value ? value.name : "Click to upload or drag your receipt here"}
              </span>
              <span className="text-[11px] text-slate-400">{t("payment.receiptHint")} — max 10MB</span>
              <input
                {...field}
                id="receipt"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0])}
              />
            </label>
          )}
        />
        {errors.receipt && <p className="text-xs text-destructive">{errors.receipt.message}</p>}
      </div>

      {isSubmitting && progress > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl">
        {isSubmitting ? t("payment.uploading") : t("payment.uploadReceipt")}
      </Button>
    </form>
  );
}
