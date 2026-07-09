import { NotificacoesBell } from "@/components/chamados/notificacoes-bell";
import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell area="tecnico" mostrarEscalados={profile?.papel === "tecnico_senior"} extra={<NotificacoesBell />}>
      {children}
    </AppShell>
  );
}
