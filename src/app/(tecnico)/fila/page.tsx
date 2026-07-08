"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, PrioridadeBadge } from "@/components/chamados/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORIDADE_LABELS, STATUS_LABELS } from "@/lib/chamados";
import { createClient } from "@/lib/supabase/client";
import type { Database, PrioridadeChamado, StatusChamado } from "@/types/database";

type Chamado = Database["public"]["Tables"]["chamados"]["Row"];

const TODOS = "todos";

export default function FilaPage() {
  const supabase = useMemo(() => createClient(), []);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);

  const [filtroStatus, setFiltroStatus] = useState<string>(TODOS);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>(TODOS);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>(TODOS);
  const [filtroCategoria, setFiltroCategoria] = useState<string>(TODOS);

  useEffect(() => {
    supabase
      .from("chamados")
      .select("*")
      .order("criado_em", { ascending: false })
      .then(async ({ data }) => {
        setChamados(data ?? []);
        const idsEmpresas = Array.from(new Set((data ?? []).map((c) => c.empresa_id)));
        if (idsEmpresas.length) {
          const { data: empresasData } = await supabase
            .from("empresas_clientes")
            .select("id, nome")
            .in("id", idsEmpresas);
          setEmpresas(Object.fromEntries((empresasData ?? []).map((e) => [e.id, e.nome])));
        }
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresasOptions = Array.from(new Set(chamados.map((c) => c.empresa_id))).map((id) => ({
    id,
    nome: empresas[id] ?? id,
  }));
  const categoriasOptions = Array.from(
    new Set(chamados.map((c) => c.categoria).filter((c): c is string => Boolean(c)))
  );

  const lista = chamados.filter(
    (c) =>
      (filtroStatus === TODOS || c.status === filtroStatus) &&
      (filtroPrioridade === TODOS || c.prioridade === filtroPrioridade) &&
      (filtroEmpresa === TODOS || c.empresa_id === filtroEmpresa) &&
      (filtroCategoria === TODOS || c.categoria === filtroCategoria)
  );

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold">Fila de chamados</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v ?? TODOS)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {(Object.entries(STATUS_LABELS) as [StatusChamado, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroPrioridade} onValueChange={(v) => setFiltroPrioridade(v ?? TODOS)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as prioridades</SelectItem>
            {(Object.entries(PRIORIDADE_LABELS) as [PrioridadeChamado, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEmpresa} onValueChange={(v) => setFiltroEmpresa(v ?? TODOS)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as empresas</SelectItem>
            {empresasOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroCategoria} onValueChange={(v) => setFiltroCategoria(v ?? TODOS)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as categorias</SelectItem>
            {categoriasOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!carregando && lista.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum chamado com esses filtros.</p>
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
                {empresas[chamado.empresa_id] ?? "—"} · {chamado.categoria ?? "Sem categoria"} ·{" "}
                {new Date(chamado.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2">
              <PrioridadeBadge prioridade={chamado.prioridade} />
              <StatusBadge status={chamado.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
