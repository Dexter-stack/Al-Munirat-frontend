import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialIcon } from "@/components/common/MaterialIcon";

interface SuspendStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  isSubmitting: boolean;
  onConfirm: (reason: string | undefined) => void;
}

/**
 * Shared between Students.tsx (list row action) and StudentDetail.tsx
 * (profile action) — both need to collect an optional reason before
 * calling adminStudentsApi.suspend(id, reason).
 */
export function SuspendStudentDialog({
  open,
  onOpenChange,
  studentName,
  isSubmitting,
  onConfirm,
}: SuspendStudentDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adminShared.suspendDialogTitle", { name: studentName })}</DialogTitle>
          <DialogDescription>{t("adminShared.suspendDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="suspend-reason">{t("adminShared.reasonLabel")}</Label>
          <Textarea
            id="suspend-reason"
            placeholder={t("adminShared.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-24"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {isSubmitting ? (
              <MaterialIcon name="progress_activity" className="animate-spin text-base" />
            ) : (
              <MaterialIcon name="block" className="text-base" />
            )}
            {t("adminShared.suspendButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
