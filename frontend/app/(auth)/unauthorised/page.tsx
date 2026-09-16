import { dashboardForRole, getSession } from "@backend/auth/session";
import { Logo } from "@/shared/components/logo";
import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function UnauthorisedPage() {
  const session = await getSession();
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-5 text-white">
      <div className="w-full max-w-lg rounded-[24px] border border-white/10 bg-white/6 p-8 text-center sm:p-12">
        <div className="flex justify-center"><Logo inverse /></div>
        <span className="mx-auto mt-10 grid size-16 place-items-center rounded-full bg-berry/25 text-[#ffabc4]"><ShieldAlert size={28} /></span>
        <p className="eyebrow mt-7 text-marigold">Role-protected area</p>
        <h1 className="display mt-3 text-4xl font-semibold">That workspace isn’t yours.</h1>
        <p className="mt-4 text-sm leading-7 text-white/50">Trufeta enforces permissions on the server. Your account cannot access this role’s records or actions.</p>
        <Link className="btn-primary mt-8" href={session ? dashboardForRole(session.role) : "/login"}>{session ? "Return to my workspace" : "Sign in"}<ArrowRight size={15} /></Link>
      </div>
    </main>
  );
}
