import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { QuestionOptionAdmin, QuestionType } from "@/types/exam";

/**
 * Admin-only options editor for exam question forms. Carries `is_correct`
 * for each option — never import this outside src/pages/admin or
 * src/components/admin, and never let a student-facing view render it.
 */
interface QuestionOptionsEditorProps {
  type: QuestionType;
  options: QuestionOptionAdmin[];
  onChange: (options: QuestionOptionAdmin[]) => void;
}

const TRUE_FALSE_OPTIONS: QuestionOptionAdmin[] = [
  { id: -1, option_text: "True", arabic_option_text: "صحيح", is_correct: false },
  { id: -2, option_text: "False", arabic_option_text: "خطأ", is_correct: false },
];

export function QuestionOptionsEditor({ type, options, onChange }: QuestionOptionsEditorProps) {
  const { t } = useTranslation();
  // Keep true/false questions locked to exactly two fixed options; seed a
  // blank pair the first time a non-true/false type has no options yet.
  useEffect(() => {
    if (type === "true_false") {
      const isTrueFalseShape =
        options.length === 2 && options[0]?.option_text === "True" && options[1]?.option_text === "False";
      if (!isTrueFalseShape) {
        onChange(TRUE_FALSE_OPTIONS.map((o) => ({ ...o })));
      }
    } else if (options.length === 0) {
      onChange([
        { id: -1, option_text: "", is_correct: false },
        { id: -2, option_text: "", is_correct: false },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function updateOption(index: number, patch: Partial<QuestionOptionAdmin>) {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function addOption() {
    onChange([...options, { id: -(options.length + 1), option_text: "", is_correct: false }]);
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function setSingleCorrect(index: number) {
    onChange(options.map((o, i) => ({ ...o, is_correct: i === index })));
  }

  if (type === "true_false") {
    const correctIndex = options.findIndex((o) => o.is_correct);
    return (
      <div className="space-y-2">
        <Label>{t("adminQuestionBank.optionsCorrectAnswer")}</Label>
        <RadioGroup
          value={correctIndex >= 0 ? String(correctIndex) : undefined}
          onValueChange={(value) => setSingleCorrect(Number(value))}
        >
          {options.map((option, index) => (
            <label
              key={option.option_text}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 hover:border-brand-200"
            >
              <RadioGroupItem value={String(index)} />
              <span className="text-sm font-medium text-slate-700">{option.option_text}</span>
              {option.arabic_option_text && (
                <span dir="rtl" className="font-arabic text-sm text-slate-500">
                  {option.arabic_option_text}
                </span>
              )}
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  }

  const isSingleCorrect = type === "multiple_choice";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {isSingleCorrect ? t("adminQuestionBank.optionsSelectOneCorrect") : t("adminQuestionBank.optionsSelectAnyCorrect")}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <MaterialIcon name="add" className="text-base" />
          {t("adminQuestionBank.addOption")}
        </Button>
      </div>

      {isSingleCorrect ? (
        <RadioGroup
          value={String(options.findIndex((o) => o.is_correct))}
          onValueChange={(value) => setSingleCorrect(Number(value))}
          className="space-y-2"
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5">
              <RadioGroupItem value={String(index)} aria-label={t("adminQuestionBank.markOptionCorrect", { index: index + 1 })} />
              <OptionInputs option={option} index={index} onUpdate={(patch) => updateOption(index, patch)} t={t} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
              >
                <MaterialIcon name="close" className="text-base" />
              </Button>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5">
              <Checkbox
                checked={option.is_correct}
                onCheckedChange={(value) => updateOption(index, { is_correct: Boolean(value) })}
                aria-label={t("adminQuestionBank.markOptionCorrect", { index: index + 1 })}
              />
              <OptionInputs option={option} index={index} onUpdate={(patch) => updateOption(index, patch)} t={t} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
              >
                <MaterialIcon name="close" className="text-base" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptionInputs({
  option,
  index,
  onUpdate,
  t,
}: {
  option: QuestionOptionAdmin;
  index: number;
  onUpdate: (patch: Partial<QuestionOptionAdmin>) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <>
      <Input
        value={option.option_text}
        onChange={(e) => onUpdate({ option_text: e.target.value })}
        placeholder={t("adminQuestionBank.optionPlaceholder", { index: index + 1 })}
        className="flex-1"
      />
      <Input
        value={option.arabic_option_text ?? ""}
        onChange={(e) => onUpdate({ arabic_option_text: e.target.value })}
        placeholder={t("adminQuestionBank.optionArabicPlaceholder")}
        dir="rtl"
        className="flex-1 font-arabic"
      />
    </>
  );
}
