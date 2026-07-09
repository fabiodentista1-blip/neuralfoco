import { Inbox, CheckCircle2, Clock, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolucaoJuniorChart } from "@/components/admin/evolucao-junior-chart";
import { DistribuicaoDonut } from "@/components/admin/distribuicao-donut";
import { CardMetrica } from "@/components/metricas/card-metrica";
import { STATUS_ABERTOS, STATUS_LABELS } from "@/lib/chamados";
import { createClient } from "@/lib/supabase/server";
import type { StatusChamado } from "@/types/database";

function chaveDoMes(data: string) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function rotuloDoMes(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default async function DesempenhoPage() {
  const supabase = await createClient();

  const [{ data: chamados }, { data: escalonamentos }, { data: juniores }, { data: empresas }] = await Promise.all([
    supabase.from("chamados").select("*"),
    supabase.from("escalonamentos").select("*"),
    supabase.from("profiles").select("id, nome").eq("papel", "tecnico_junior"),
    supabase.from("empresas_clientes").select("id, nome"),
  ]);

  const listaChamados = chamados ?? [];
  const listaEscalonamentos = escalonamentos ?? [];
  const statusAbertosSet = new Set(STATUS_ABERTOS);

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

  const chamadosAbertos = listaChamados.filter((c) => statusAbertosSet.has(c.status)).length;
  const resolvidosNoMes = listaChamados.filter(
    (c) => c.status === "resolvido" && c.resolvido_em && c.resolvido_em >= inicioMes
  ).length;

  const resolvidosTodos = listaChamados.filter((c) => c.resolvido_em);
  const tempoMedioHoras = resolvidosTodos.length
    ? resolvidosTodos.reduce(
        (soma, c) => soma + (new Date(c.resolvido_em!).getTime() - new Date(c.criado_em).getTime()),
        0
      ) /
      resolvidosTodos.length /
      3_600_000
    : 0;

  const empresaNome = new Map((empresas ?? []).map((e) => [e.id, e.nome]));
  const contagemPorEmpresa = new Map<string, number>();
  for (const c of listaChamados) {
    contagemPorEmpresa.set(c.empresa_id, (contagemPorEmpresa.get(c.empresa_id) ?? 0) + 1);
  }
  const topEmpresas = Array.from(contagemPorEmpresa.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({ nome: empresaNome.get(id) ?? id, total }));

  const contagemPorStatus = new Map<StatusChamado, number>();
  for (const c of listaChamados) {
    contagemPorStatus.set(c.status, (contagemPorStatus.get(c.status) ?? 0) + 1);
  }
  const distribuicaoStatus = Array.from(contagemPorStatus.entries()).map(([status, total]) => ({
    nome: STATUS_LABELS[status],
    valor: total,
  }));

  const contagemPorCategoria = new Map<string, number>();
  for (const c of listaChamados) {
    const chave = c.categoria ?? "Sem categoria";
    contagemPorCategoria.set(chave, (contagemPorCategoria.get(chave) ?? 0) + 1);
  }
  const distribuicaoCategoria = Array.from(contagemPorCategoria.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nome, total]) => ({ nome, valor: total }));

  const idsJuniores = new Set((juniores ?? []).map((j) => j.id));

  const meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const dadosEvolucao = meses.map((chave) => {
    const resolvidosJuniorMes = listaChamados.filter(
      (c) =>
        c.atribuido_a &&
        idsJuniores.has(c.atribuido_a) &&
        c.status === "resolvido" &&
        c.resolvido_em &&
        chaveDoMes(c.resolvido_em) === chave
    );
    const sozinho = resolvidosJuniorMes.filter((c) => c.nivel_resolucao === "sozinho").length;
    const comIa = resolvidosJuniorMes.filter((c) => c.nivel_resolucao === "com_ia").length;
    const comBruno = resolvidosJuniorMes.filter((c) => c.nivel_resolucao === "com_bruno").length;
    const escalonamentosMes = listaEscalonamentos.filter((e) => chaveDoMes(e.criado_em) === chave).length;
    const totalResolvidos = resolvidosJuniorMes.length;
    const taxaEscalonamento = totalResolvidos > 0 ? Math.round((escalonamentosMes / totalResolvidos) * 100) : 0;
    return { mes: rotuloDoMes(chave), sozinho, comIa, comBruno, taxaEscalonamento };
  });

  const mesAtualChave = meses[meses.length - 1];
  const resolvidosJuniorEsteMes = listaChamados.filter(
    (c) =>
      c.atribuido_a &&
      idsJuniores.has(c.atribuido_a) &&
      c.status === "resolvido" &&
      c.resolvido_em &&
      chaveDoMes(c.resolvido_em) === mesAtualChave
  );
  const totalAtendidoMes = resolvidosJuniorEsteMes.length;
  const percentualSozinho = totalAtendidoMes
    ? Math.round(
        (resolvidosJuniorEsteMes.filter((c) => c.nivel_resolucao === "sozinho").length / totalAtendidoMes) * 100
      )
    : 0;
  const tempoMedioJuniorHoras = resolvidosJuniorEsteMes.length
    ? resolvidosJuniorEsteMes.reduce(
        (soma, c) => soma + (new Date(c.resolvido_em!).getTime() - new Date(c.criado_em).getTime()),
        0
      ) /
      resolvidosJuniorEsteMes.length /
      3_600_000
    : 0;

  const cargaBrunoMes = listaEscalonamentos.filter(
    (e) => e.resolvido_em && chaveDoMes(e.resolvido_em) === mesAtualChave
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold">Desempenho</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CardMetrica titulo="Chamados abertos" valor={chamadosAbertos} icon={Inbox} cor="azul" />
        <CardMetrica titulo="Resolvidos no mês" valor={resolvidosNoMes} icon={CheckCircle2} cor="verde" />
        <CardMetrica titulo="Tempo médio de resolução" valor={`${tempoMedioHoras.toFixed(1)}h`} icon={Clock} cor="ambar" />
        <CardMetrica
          titulo="Escalonamentos (Bruno) no mês"
          valor={cargaBrunoMes}
          icon={ArrowUpCircle}
          cor="roxo"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamados por status</CardTitle>
          </CardHeader>
          <CardContent>
            <DistribuicaoDonut dados={distribuicaoStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamados por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <DistribuicaoDonut dados={distribuicaoCategoria} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 empresas por volume de chamados</CardTitle>
        </CardHeader>
        <CardContent>
          {topEmpresas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {topEmpresas.map((e) => (
                <li key={e.nome} className="flex justify-between">
                  <span>{e.nome}</span>
                  <span className="text-muted-foreground">{e.total}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do júnior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <CardMetrica titulo="Total atendido no mês" valor={totalAtendidoMes} icon={CheckCircle2} cor="teal" />
            <CardMetrica titulo="% sozinho" valor={`${percentualSozinho}%`} icon={CheckCircle2} cor="azul" />
            <CardMetrica titulo="Tempo médio dele" valor={`${tempoMedioJuniorHoras.toFixed(1)}h`} icon={Clock} cor="ambar" />
          </div>
          <EvolucaoJuniorChart dados={dadosEvolucao} />
        </CardContent>
      </Card>
    </div>
  );
}
