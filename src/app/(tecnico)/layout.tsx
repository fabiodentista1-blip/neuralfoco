import Link from "next/link";
import { NotificacoesBell } from "@/components/chamados/notificacoes-bell";
import { createClient } from "@/lib/supabase/server";

export default async function TecnicoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("papel").eq("id", user.id).single()
    : { data: null };

  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/fila" className="hover:underline">
            Fila
          </Link>
          {profile?.papel === "tecnico_senior" && (
            <Link href="/escalados" className="hover:underline">
              Escalados
            </Link>
          )}
        </nav>
        <NotificacoesBell />
      </header>
      {children}
    </div>
  );
}
