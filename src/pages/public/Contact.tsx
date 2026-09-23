import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/public/PageHeader";
import { publicApi } from "@/api/public";
import { ApiClientError } from "@/api/client";
import { pickLocalized } from "@/lib/localized";

export default function ContactPage() {
  const { t, i18n } = useTranslation();

  const contactInfoQuery = useQuery({
    queryKey: ["public", "contact-info"],
    queryFn: () => publicApi.contactInfo(),
    staleTime: 5 * 60 * 1000,
  });
  const info = contactInfoQuery.data;

  const SUBJECTS = [
    { value: "Admissions Inquiry", label: t("contactPage.subjectAdmissions") },
    { value: "Course Information", label: t("contactPage.subjectCourseInfo") },
    { value: "Hajj & Umrah Pilgrimage Inquiry", label: t("contactPage.subjectHajjUmrah") },
    { value: "Fee & Payment Support", label: t("contactPage.subjectFeePayment") },
    { value: "Technical / Portal Support", label: t("contactPage.subjectTechnical") },
    { value: "Other", label: t("contactPage.subjectOther") },
  ];

  const address = info ? pickLocalized(info.address ?? "", info.arabic_address, i18n.language) : null;

  const CONTACT_INFO = [
    {
      icon: "location_on",
      title: t("contactPage.campusAddressTitle"),
      lines: address?.text
        ? [{ text: address.text, isArabic: address.isArabic }]
        : [
            { text: t("contactPage.campusAddressLine1"), isArabic: false },
            { text: t("contactPage.campusAddressLine2"), isArabic: false },
          ],
    },
    {
      icon: "call",
      title: t("contactPage.phoneTitle"),
      lines: [{ text: info?.phone || t("contactPage.phoneLine1"), isArabic: false }],
    },
    {
      icon: "mail",
      title: t("contactPage.emailTitle"),
      lines: [{ text: info?.email || t("contactPage.emailLine1"), isArabic: false }],
    },
  ];

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("contactPage.errorName")),
        email: z.string().min(1, t("contactPage.errorEmailRequired")).email(t("contactPage.errorEmailInvalid")),
        phone: z.string().optional(),
        subject: z.string().min(1, t("contactPage.errorSubject")),
        message: z.string().min(10, t("contactPage.errorMessageMin")),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => publicApi.contact(values),
    onSuccess: () => {
      toast.success(t("contactPage.toastSuccess"));
      reset();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("contactPage.toastError"));
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={t("contactPage.eyebrow")}
        title={t("contactPage.title")}
        description={t("contactPage.description")}
        icon="mail"
      />

      <section className="bg-white pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <div className="space-y-4">
                {CONTACT_INFO.map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                      <MaterialIcon name={item.icon} className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {item.lines.map((line) => (
                        <p
                          key={line.text}
                          dir={line.isArabic ? "rtl" : undefined}
                          className={`mt-0.5 text-xs text-slate-500 ${line.isArabic ? "font-arabic text-right" : ""}`}
                        >
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex h-56 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-400">
                <MaterialIcon name="map" className="text-4xl" />
                <span className="text-xs font-semibold">{t("contactPage.mapComingSoon")}</span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    {t("contactPage.sendMessageEyebrow")}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">{t("contactPage.getInTouchTitle")}</h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">{t("contactPage.labelFullName")}</Label>
                      <Input id="contact-name" className="h-11 rounded-xl bg-slate-50" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">{t("contactPage.labelEmail")}</Label>
                      <Input id="contact-email" type="email" className="h-11 rounded-xl bg-slate-50" {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone">{t("contactPage.labelPhoneOptional")}</Label>
                      <Input id="contact-phone" type="tel" className="h-11 rounded-xl bg-slate-50" {...register("phone")} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-subject">{t("contactPage.labelSubject")}</Label>
                      <Controller
                        control={control}
                        name="subject"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="contact-subject" className="h-11 w-full rounded-xl bg-slate-50">
                              <SelectValue placeholder={t("contactPage.subjectPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">{t("contactPage.labelMessage")}</Label>
                    <Textarea
                      id="contact-message"
                      rows={5}
                      className="rounded-xl bg-slate-50"
                      placeholder={t("contactPage.messagePlaceholder")}
                      {...register("message")}
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" disabled={mutation.isPending} className="h-12 w-full rounded-xl text-sm font-semibold">
                    <MaterialIcon name="send" className="text-sm" />
                    {mutation.isPending ? t("contactPage.submitSending") : t("contactPage.submitIdle")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
