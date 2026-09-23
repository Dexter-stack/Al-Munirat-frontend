import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import logoImage from "@/assets/logo.jpg";
import { publicApi } from "@/api/public";

export function PublicFooter() {
  const { t } = useTranslation();

  const settingsQuery = useQuery({
    queryKey: ["public", "settings"],
    queryFn: () => publicApi.settings(),
    staleTime: 10 * 60 * 1000,
  });
  const settings = settingsQuery.data;

  const academiaLinks = [
    { to: "/courses", label: t("nav.courses") },
    { to: "/about", label: t("nav.about") },
  ];

  const pilgrimageLinks = [{ to: "/hajj-umrah", label: t("nav.hajjUmrah") }];

  const portalLinks = [
    { to: "/login", label: t("footer.studentDashboard") },
    { to: "/register", label: t("footer.feeVerification") },
    { to: "/events", label: t("footer.seminarCalendar") },
  ];

  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-white p-0.5">
                <img src={logoImage} alt="Al-Munirat Academy" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-base font-extrabold tracking-tight text-white">Al-Munirat Academy</div>
                <div dir="rtl" className="font-arabic text-[11px] font-semibold text-slate-400">
                  {t("footer.motto")}
                </div>
              </div>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">{t("footer.tagline")}</p>
            {(settings?.contact_email || settings?.contact_phone) && (
              <div className="space-y-1.5 pt-1">
                {settings.contact_email && (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white"
                  >
                    <MaterialIcon name="mail" className="text-sm" />
                    {settings.contact_email}
                  </a>
                )}
                {settings.contact_phone && (
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white"
                  >
                    <MaterialIcon name="call" className="text-sm" />
                    {settings.contact_phone}
                  </a>
                )}
              </div>
            )}
          </div>

          <FooterColumn heading={t("footer.academiaHeading")} links={academiaLinks} />
          <FooterColumn heading={t("footer.pilgrimageHeading")} links={pilgrimageLinks} />
          <FooterColumn heading={t("footer.portalsHeading")} links={portalLinks} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-8 text-[11px] text-slate-500 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Al-Munirat Academy. {t("footer.rights")}
          </div>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="transition-colors hover:text-slate-300">
              {t("footer.privacyPolicy")}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-slate-300">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, links }: { heading: string; links: { to: string; label: string }[] }) {
  return (
    <div className="space-y-2.5">
      <div className="text-xs font-bold uppercase tracking-wider text-white">{heading}</div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
