"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Escalonamento = Database["public"]["Tables"]["escalonamentos"]["Row"];
type Chamado = Database["public"]["Tables"]["chamados"]["Row"];

export default function EscaladosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [escalonamentos, setEscalonamentos] = useState<Escalonamento[]>([]);
  const [chamados, setChamados] = useState<Record<string, Chamado>>({});
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function carregar() {
    const { data } = await supabase
      .from("escalonamentos")
      .select("*")
      .is("resolvido_em", null)
      .order("criado_em", { ascending: true });
    const lista = data ?? [];
    setEscalonamentos(lista);

    const idsChamados = Array.from(new Set(lista.map((e) => e.chamado_id)));
    const idsPessoas = Array.from(new Set(lista.map((e) => e.solicitado_por)));

    if (idsChamados.length) {
      const { data: chamadosData } = await supabase.from("chamados").select("*").in("id", idsChamados);
      setChamados(Object.fromEntries((chamadosData ?? []).map((c) => [c.id, c])));
    }
    if (idsPessoas.length) {
      const { data: perfis } = await supabase.from("profiles").select("id, nome").in("id", idsPessoas);
      setNomes(Object.fromEntries((perfis ?? []).map((p) => [p.id, p.nome])));
    }
    setCarregando(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resolver(id: string) {
    if (!userId) return;
    await supabase
      .from("escalonamentos")
      .update({ atendido_por: userId, resolvido_em: new Date().toISOString() })
      .eq("id", id);
    setEscalonamentos((atual) => atual.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Escalonamentos pendentes</h1>

      {!carregando && escalonamentos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum escalonamento pendente.</p>
      )}

      <div className="space-y-3">
        {escalonamentos.map((e) => {
          const chamado = chamados[e.chamado_id];
          return (
            <div key={e.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{chamado?.titulo ?? "Chamado"}</p>
                  <p className="text-sm text-muted-foreground">
                    Solicitado por {nomes[e.solicitado_por] ?? "—"} em{" "}
                    {new Date(e.criado_em).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-2 text-sm">{e.motivo}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/chamados/${e.chamado_id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Entrar no chamado
                  </Link>
                  <Button size="sm" onClick={() => resolver(e.id)}>
                    Marcar como resolvido
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
