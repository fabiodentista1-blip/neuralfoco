import { Inbox, Clock3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CardMetrica } from "@/components/metricas/card-metrica";
import { STATUS_ABERTOS } from "@/lib/chamados";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [abertos, aguardando, criticos, resolvidosSemana] = await Promise.all([
    supabase
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", user.id)
      .in("status", STATUS_ABERTOS),
    supabase
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", user.id)
      .eq("status", "aguardando_cliente"),
    supabase
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", user.id)
      .eq("prioridade", "critica")
      .in("status", STATUS_ABERTOS),
    supabase
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", user.id)
      .eq("status", "resolvido")
      .gte("resolvido_em", seteDiasAtras),
  ]);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CardMetrica titulo="Meus chamados abertos" valor={abertos.count ?? 0} icon={Inbox} cor="azul" />
        <CardMetrica titulo="Aguardando cliente" valor={aguardando.count ?? 0} icon={Clock3} cor="ambar" />
        <CardMetrica titulo="Críticos" valor={criticos.count ?? 0} icon={AlertTriangle} cor="vermelho" />
        <CardMetrica titulo="Resolvidos na semana" valor={resolvidosSemana.count ?? 0} icon={CheckCircle2} cor="verde" />
      </div>
    </div>
  );
}
