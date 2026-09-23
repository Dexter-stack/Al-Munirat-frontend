import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/common/MaterialIcon";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  arabicTitle?: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
}

/**
 * Shared banner used at the top of every top-level public page (About,
 * Courses, Events, Hajj & Umrah, Contact) so they read as one system
 * instead of each page inventing its own header — mirrors Hero.tsx's
 * gradient-blob + badge-pill language at a lighter, page-header scale.
 */
export function PageHeader({ eyebrow, title, arabicTitle, description, icon = "mosque", children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white pb-14 pt-14 lg:pb-20 lg:pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-100/40 via-sky-50/30 to-transparent blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-600">
            <MaterialIcon name={icon} className="text-sm" />
            {eyebrow}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">{title}</h1>
          {arabicTitle && (
            <p dir="rtl" className="mt-2 font-arabic text-xl text-slate-600">
              {arabicTitle}
            </p>
          )}
          {description && <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
