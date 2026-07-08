import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/chamados/status-badge";
import { STATUS_ABERTOS, STATUS_FECHADOS } from "@/lib/chamados";
import { createClient } from "@/lib/supabase/server";
import type { StatusChamado } from "@/types/database";

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const supabase = await createClient();

  const { data: chamados } = await supabase
    .from("chamados")
    .select("id, titulo, status, prioridade, categoria, criado_em")
    .order("criado_em", { ascending: false });

  const statusFiltro: StatusChamado[] = filtro === "fechados" ? STATUS_FECHADOS : STATUS_ABERTOS;
  const lista = (chamados ?? []).filter((c) => statusFiltro.includes(c.status));

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus chamados</h1>
        <Link href="/chamados/novo" className={buttonVariants()}>
          Abrir chamado
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href="/chamados?filtro=abertos">
          <Badge variant={filtro !== "fechados" ? "default" : "outline"}>Abertos</Badge>
        </Link>
        <Link href="/chamados?filtro=fechados">
          <Badge variant={filtro === "fechados" ? "default" : "outline"}>Fechados</Badge>
        </Link>
      </div>

      {lista.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum chamado por aqui ainda.</p>
      )}

      <div className="space-y-2">
        {lista.map((chamado) => (
          <Link
            key={chamado.id}
            href={`/chamados/${chamado.id}`}
            className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{chamado.titulo}</p>
              <p className="text-sm text-muted-foreground">
                {chamado.categoria ?? "Sem categoria"} ·{" "}
                {new Date(chamado.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <StatusBadge status={chamado.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
