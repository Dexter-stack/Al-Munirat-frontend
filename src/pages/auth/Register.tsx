import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publicApi } from "@/api/public";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/api/client";

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().min(6, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female"], { message: "Select a gender" }),
    address: z.string().min(1, "Address is required"),
    class_id: z.string().min(1, "Select a class"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const classLevelsQuery = useQuery({ queryKey: ["public", "class-levels"], queryFn: publicApi.classLevels });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser({ ...values, class_id: Number(values.class_id) });
      navigate("/payment", { replace: true });
    } catch (error) {
      if (error instanceof ApiClientError && error.isValidation && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field in schema.shape) {
            setError(field as keyof FormValues, { message: messages[0] });
          }
        });
        toast.error("Please correct the highlighted fields.");
        return;
      }
      toast.error(error instanceof ApiClientError ? error.message : "Unable to create your account.");
    }
  }

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-10">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {t("auth.createAccountTitle")}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{t("auth.createAccountSubtitle")}</p>
            </div>
            <div className="shrink-0 sm:text-end">
              <span className="text-sm text-slate-500">{t("auth.alreadyRegistered")}</span>
              <Link to="/login" className="block text-sm font-bold text-brand-600 hover:underline">
                {t("auth.signInHere")} →
              </Link>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("auth.firstName")} htmlFor="first_name" error={errors.first_name?.message}>
                <Input id="first_name" className="h-11 rounded-xl bg-slate-50" {...register("first_name")} />
              </Field>
              <Field label={t("auth.lastName")} htmlFor="last_name" error={errors.last_name?.message}>
                <Input id="last_name" className="h-11 rounded-xl bg-slate-50" {...register("last_name")} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("auth.email")} htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" className="h-11 rounded-xl bg-slate-50" {...register("email")} />
              </Field>
              <Field label={t("auth.phone")} htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" type="tel" className="h-11 rounded-xl bg-slate-50" {...register("phone")} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("auth.dateOfBirth")} htmlFor="date_of_birth" error={errors.date_of_birth?.message}>
                <Input
                  id="date_of_birth"
                  type="date"
                  className="h-11 rounded-xl bg-slate-50"
                  {...register("date_of_birth")}
                />
              </Field>
              <Field label={t("auth.gender")} htmlFor="gender" error={errors.gender?.message}>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="gender" className="h-11 w-full rounded-xl bg-slate-50">
                        <SelectValue placeholder={t("auth.gender")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("auth.male")}</SelectItem>
                        <SelectItem value="female">{t("auth.female")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field label={t("auth.address")} htmlFor="address" error={errors.address?.message}>
              <Input id="address" className="h-11 rounded-xl bg-slate-50" {...register("address")} />
            </Field>

            <Field label={t("auth.classLevel")} htmlFor="class_id" error={errors.class_id?.message}>
              <Controller
                control={control}
                name="class_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="class_id" className="h-11 w-full rounded-xl bg-slate-50">
                      <SelectValue placeholder={t("auth.classLevel")} />
                    </SelectTrigger>
                    <SelectContent>
                      {classLevelsQuery.data?.map((level) => (
                        <SelectItem key={level.id} value={String(level.id)}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("auth.password")} htmlFor="password" error={errors.password?.message}>
                <div className="relative flex items-center">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-xl bg-slate-50 pe-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-3 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-lg" />
                  </button>
                </div>
              </Field>
              <Field
                label={t("auth.confirmPassword")}
                htmlFor="password_confirmation"
                error={errors.password_confirmation?.message}
              >
                <div className="relative flex items-center">
                  <Input
                    id="password_confirmation"
                    type={showConfirm ? "text" : "password"}
                    className="h-11 rounded-xl bg-slate-50 pe-10"
                    {...register("password_confirmation")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute end-3 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    <MaterialIcon name={showConfirm ? "visibility_off" : "visibility"} className="text-lg" />
                  </button>
                </div>
              </Field>
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl text-sm font-bold">
              {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
              {!isSubmitting && <MaterialIcon name="arrow_forward" className="text-lg" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
