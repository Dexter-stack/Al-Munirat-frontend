import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";

export function EnrollmentCta() {
  const { t } = useTranslation();
  return (
    <section className="border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28" id="enrollment-hub">
      <div className="mx-auto max-w-3xl px-4 sm:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600">
            <MaterialIcon name="how_to_reg" className="text-2xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t("home.enrollmentCta.title")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500 sm:text-sm">
            {t("home.enrollmentCta.description")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-auto w-full rounded-xl px-7 py-3.5 text-sm sm:w-auto">
              <Link to="/register">
                <MaterialIcon name="task_alt" className="text-base" />
                {t("home.enrollmentCta.ctaRegister")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-auto w-full rounded-xl px-7 py-3.5 text-sm sm:w-auto">
              <Link to="/contact">
                {t("home.enrollmentCta.ctaContact")}
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
