import { Outlet } from "react-router-dom";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800 antialiased">
      <PublicHeader />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
