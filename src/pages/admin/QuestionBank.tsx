import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QuestionOptionsEditor } from "@/components/admin/QuestionOptionsEditor";
import { QueryState } from "@/components/states/QueryState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminExamQuestionsApi } from "@/api/admin/examQuestions";
import { adminExamsApi } from "@/api/admin/exams";
import { ApiClientError } from "@/api/client";
import type { ExamQuestionAdmin, QuestionOptionAdmin, QuestionType } from "@/types/exam";

const QUESTION_TYPES: QuestionType[] = ["multiple_choice", "true_false", "multiple_answer"];

const TYPE_META: Record<QuestionType, { labelKey: string; className: string }> = {
  multiple_choice: { labelKey: "adminQuestionBank.typeMultipleChoice", className: "border-brand-100 bg-brand-50 text-brand-700" },
  true_false: { labelKey: "adminQuestionBank.typeTrueFalse", className: "border-amber-100 bg-amber-50 text-amber-700" },
  multiple_answer: { labelKey: "adminQuestionBank.typeMultipleAnswer", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
};

function buildQuestionSchema(t: (key: string) => string) {
  return z.object({
    question_text: z.string().min(1, t("adminQuestionBank.textRequired")),
    arabic_question_text: z.string().optional(),
    type: z.enum(["multiple_choice", "true_false", "multiple_answer"]),
    marks: z.number().min(1, t("adminQuestionBank.marksError")),
  });
}

type QuestionFormValues = z.infer<ReturnType<typeof buildQuestionSchema>>;

function buildOptionsSchema(t: (key: string) => string) {
  const optionSchema = z.object({
    id: z.number().optional(),
    option_text: z.string().min(1, t("adminQuestionBank.optionTextRequired")),
    arabic_option_text: z.string().optional(),
    is_correct: z.boolean(),
  });

  return z
    .array(optionSchema)
    .min(2, t("adminQuestionBank.minTwoOptions"))
    .refine((opts) => opts.some((o) => o.is_correct), { message: t("adminQuestionBank.markOneCorrect") });
}

const EMPTY_VALUES: QuestionFormValues = {
  question_text: "",
  arabic_question_text: "",
  type: "multiple_choice",
  marks: 1,
};

export default function AdminQuestionBankPage() {
  const { t } = useTranslation();
  const questionSchema = useMemo(() => buildQuestionSchema(t), [t]);
  const optionsSchema = useMemo(() => buildOptionsSchema(t), [t]);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get("examId") ? Number(searchParams.get("examId")) : null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ExamQuestionAdmin | null>(null);
  const [options, setOptions] = useState<QuestionOptionAdmin[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const examsQuery = useQuery({
    queryKey: ["admin", "exams", "picker"],
    queryFn: () => adminExamsApi.list({ per_page: 100 }),
  });

  const questionsQuery = useQuery({
    queryKey: ["admin", "exams", examId, "questions"],
    queryFn: () => adminExamQuestionsApi.list(examId as number),
    enabled: examId !== null,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: EMPTY_VALUES,
  });

  const selectedType = watch("type");

  // Re-fetch and clear any open form state whenever the selected exam changes.
  useEffect(() => {
    setSheetOpen(false);
  }, [examId]);

  function openCreate() {
    setEditing(null);
    reset(EMPTY_VALUES);
    setOptions([
      { id: -1, option_text: "", is_correct: false },
      { id: -2, option_text: "", is_correct: false },
    ]);
    setOptionsError(null);
    setSheetOpen(true);
  }

  function openEdit(question: ExamQuestionAdmin) {
    setEditing(question);
    reset({
      question_text: question.question_text,
      arabic_question_text: question.arabic_question_text ?? "",
      type: question.type,
      marks: Number(question.marks),
    });
    setOptions(question.options.map((o) => ({ ...o })));
    setOptionsError(null);
    setSheetOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "questions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminExamQuestionsApi.create>[1]) =>
      adminExamQuestionsApi.create(examId as number, payload),
    onSuccess: () => {
      toast.success(t("adminQuestionBank.toastCreated"));
      invalidate();
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminQuestionBank.toastCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof adminExamQuestionsApi.update>[2] }) =>
      adminExamQuestionsApi.update(examId as number, id, payload),
    onSuccess: () => {
      toast.success(t("adminQuestionBank.toastUpdated"));
      invalidate();
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminQuestionBank.toastUpdateError")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminExamQuestionsApi.remove(examId as number, id),
    onSuccess: () => {
      toast.success(t("adminQuestionBank.toastDeleted"));
      invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminQuestionBank.toastDeleteError")),
  });

  function onSubmit(values: QuestionFormValues) {
    const parsedOptions = optionsSchema.safeParse(options);
    if (!parsedOptions.success) {
      setOptionsError(parsedOptions.error.issues[0]?.message ?? "Invalid options.");
      return;
    }
    if (values.type !== "multiple_answer" && options.filter((o) => o.is_correct).length !== 1) {
      setOptionsError(t("adminQuestionBank.exactlyOneCorrect"));
      return;
    }
    setOptionsError(null);

    const payload = {
      question_text: values.question_text,
      arabic_question_text: values.arabic_question_text || undefined,
      type: values.type,
      marks: values.marks,
      options: parsedOptions.data.map((o) => ({
        option_text: o.option_text,
        arabic_option_text: o.arabic_option_text || undefined,
        is_correct: o.is_correct,
      })),
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(question: ExamQuestionAdmin) {
    if (window.confirm(t("adminQuestionBank.deleteConfirm"))) {
      removeMutation.mutate(question.id);
    }
  }

  const examOptions = useMemo(() => examsQuery.data?.items ?? [], [examsQuery.data]);
  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminQuestionBank.title")}
        description={t("adminQuestionBank.subtitle")}
        action={
          <Button onClick={openCreate} disabled={examId === null}>
            <MaterialIcon name="add" className="text-base" />
            {t("adminQuestionBank.addQuestion")}
          </Button>
        }
      />

      <div className="max-w-sm space-y-1.5">
        <Label>{t("adminQuestionBank.selectExamLabel")}</Label>
        <Select
          value={examId !== null ? String(examId) : undefined}
          onValueChange={(v) => setSearchParams(v ? { examId: v } : {})}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("adminQuestionBank.selectExamPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {examOptions.map((exam) => (
              <SelectItem key={exam.id} value={String(exam.id)}>
                {exam.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {examId === null ? (
        <EmptyState
          icon="quiz"
          title={t("adminQuestionBank.noExamSelectedTitle")}
          description={t("adminQuestionBank.noExamSelectedDescription")}
        />
      ) : (
        <QueryState
          isLoading={questionsQuery.isLoading}
          error={questionsQuery.error}
          data={questionsQuery.data}
          onRetry={() => questionsQuery.refetch()}
          isEmpty={(d) => d.length === 0}
          emptyProps={{
            icon: "quiz",
            title: t("adminQuestionBank.emptyTitle"),
            description: t("adminQuestionBank.emptyDescription"),
          }}
        >
          {(questions) => (
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("adminQuestionBank.colQuestion")}</TableHead>
                      <TableHead>{t("adminQuestionBank.colType")}</TableHead>
                      <TableHead>{t("adminQuestionBank.colMarks")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => {
                      const meta = TYPE_META[question.type];
                      return (
                        <TableRow key={question.id}>
                          <TableCell className="max-w-[320px]">
                            <p className="line-clamp-2 whitespace-normal text-sm font-medium text-slate-900">
                              {question.question_text}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={meta.className}>
                              {t(meta.labelKey)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">{Number(question.marks)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MaterialIcon name="more_vert" className="text-lg" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(question)}>
                                  <MaterialIcon name="edit" className="text-base" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(question)}>
                                  <MaterialIcon name="delete" className="text-base" />
                                  {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </QueryState>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminQuestionBank.sheetTitleEdit") : t("adminQuestionBank.sheetTitleAdd")}</SheetTitle>
            <SheetDescription>
              {t("adminQuestionBank.sheetDesc")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="question_text">{t("adminQuestionBank.fieldQuestionText")}</Label>
              <Textarea id="question_text" rows={3} {...register("question_text")} aria-invalid={Boolean(errors.question_text)} />
              {errors.question_text && <p className="text-xs text-destructive">{errors.question_text.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_question_text">{t("adminQuestionBank.fieldArabicText")}</Label>
              <Textarea id="arabic_question_text" dir="rtl" className="font-arabic" rows={2} {...register("arabic_question_text")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("adminQuestionBank.fieldType")}</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminQuestionBank.selectTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(TYPE_META[type].labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="marks">{t("adminQuestionBank.fieldMarks")}</Label>
                <Input
                  id="marks"
                  type="number"
                  min={1}
                  {...register("marks", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.marks)}
                />
                {errors.marks && <p className="text-xs text-destructive">{errors.marks.message}</p>}
              </div>
            </div>

            <QuestionOptionsEditor type={selectedType} options={options} onChange={setOptions} />
            {optionsError && <p className="text-xs text-destructive">{optionsError}</p>}

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminQuestionBank.addQuestionBtn")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                {t("common.cancel")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
