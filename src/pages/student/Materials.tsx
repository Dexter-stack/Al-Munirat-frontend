import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentCoursesApi, studentMaterialsApi } from "@/api/student";
import type { Material, MaterialType } from "@/types/academic";
import { MATERIAL_TYPE_ICON, VIEWABLE_MATERIAL_TYPES } from "@/lib/materialTypes";

const TYPE_OPTIONS: MaterialType[] = ["pdf", "video", "audio", "document", "image", "text"];

const MATERIAL_TYPE_I18N_KEY: Record<MaterialType, string> = {
  pdf: "studentMaterials.typePdf",
  video: "studentMaterials.typeVideo",
  audio: "studentMaterials.typeAudio",
  document: "studentMaterials.typeDocument",
  image: "studentMaterials.typeImage",
  text: "studentMaterials.typeText",
};

export default function StudentMaterialsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const courseFilter = searchParams.get("course");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<MaterialType | "all">("all");
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const materialsQuery = useQuery({
    queryKey: ["student", "materials", { search: debouncedSearch, type, course_id: courseFilter }],
    queryFn: () =>
      studentMaterialsApi.list({
        search: debouncedSearch || undefined,
        type: type === "all" ? undefined : type,
        course_id: courseFilter ?? undefined,
        per_page: 24,
      }),
  });

  // Material only carries course_id (API_DOCUMENTATION.md §9) — resolve names client-side.
  const coursesQuery = useQuery({
    queryKey: ["student", "courses", "all"],
    queryFn: () => studentCoursesApi.list({ per_page: 100 }),
  });
  const courseNameById = new Map((coursesQuery.data?.items ?? []).map((c) => [c.id, c.name]));

  async function handleOpen(material: Material) {
    setOpeningId(material.id);
    try {
      const blobUrl = await studentMaterialsApi.downloadBlobUrl(material.id);
      if (VIEWABLE_MATERIAL_TYPES.includes(material.type)) {
        window.open(blobUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = material.title;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      toast.error(t("studentMaterials.openErrorToast"));
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentMaterials.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentMaterials.title")}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("studentMaterials.searchPlaceholder")}
            className="h-11 rounded-xl border-slate-200/90 bg-white pl-10"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as MaterialType | "all")}>
          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200/90 bg-white sm:w-48">
            <SelectValue placeholder={t("studentMaterials.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("studentMaterials.allTypes")}</SelectItem>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {t(MATERIAL_TYPE_I18N_KEY[opt])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={materialsQuery.isLoading}
        error={materialsQuery.error}
        data={materialsQuery.data}
        onRetry={() => materialsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{
          icon: "auto_stories",
          title: t("studentMaterials.emptyTitle"),
          description: t("studentMaterials.emptyDescription"),
        }}
      >
        {(data) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MaterialIcon name={MATERIAL_TYPE_ICON[m.type]} className="text-xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                    {m.arabic_title && (
                      <p dir="rtl" className="truncate font-arabic text-xs text-slate-500">
                        {m.arabic_title}
                      </p>
                    )}
                    {m.course_id && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {courseNameById.get(m.course_id) ?? "—"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                    {t(MATERIAL_TYPE_I18N_KEY[m.type])}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={openingId === m.id}
                    onClick={() => handleOpen(m)}
                    className="h-8 rounded-lg text-xs font-semibold"
                  >
                    {openingId === m.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    ) : (
                      <MaterialIcon
                        name={VIEWABLE_MATERIAL_TYPES.includes(m.type) ? "visibility" : "download"}
                        className="text-sm"
                      />
                    )}
                    {VIEWABLE_MATERIAL_TYPES.includes(m.type) ? t("studentMaterials.view") : t("studentMaterials.download")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
