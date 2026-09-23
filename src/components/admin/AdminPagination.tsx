import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import type { ApiMeta } from "@/types/api";

interface AdminPaginationProps {
  meta: ApiMeta;
  onPageChange: (page: number) => void;
}

/** Simple prev/next pagination footer shared across admin list tables. */
export function AdminPagination({ meta, onPageChange }: AdminPaginationProps) {
  const { t } = useTranslation();
  if (meta.last_page <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
      <p className="text-xs text-slate-500">
        {t("adminShared.pageOf", { current: meta.current_page, last: meta.last_page })}
        {" "}&middot; {meta.total} {t("adminShared.total")}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <MaterialIcon name="chevron_left" className="text-base" />
          {t("common.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          {t("common.next")}
          <MaterialIcon name="chevron_right" className="text-base" />
        </Button>
      </div>
    </div>
  );
}
