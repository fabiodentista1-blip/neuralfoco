"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Sugestao {
  sugestao: string;
}

interface Diagnostico {
  arquivos_suspeitos: { caminho: string; linhas?: string; motivo: string }[];
  causa_provavel: string;
  correcao_sugerida: string;
}

export function PainelIA({ chamadoId }: { chamadoId: string }) {
  const [carregandoSugestao, setCarregandoSugestao] = useState(false);
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroSugestao, setErroSugestao] = useState<string | null>(null);

  const [carregandoDiagnostico, setCarregandoDiagnostico] = useState(false);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);

  async function analisarComIA() {
    setCarregandoSugestao(true);
    setErroSugestao(null);
    try {
      const res = await fetch("/api/ia/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamadoId, tipo: "sugestao" }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro ?? "IA indisponível, tente novamente.");
      setSugestao(dados.resultado);
    } catch (err) {
      setErroSugestao(err instanceof Error ? err.message : "IA indisponível, tente novamente.");
    } finally {
      setCarregandoSugestao(false);
    }
  }

  async function diagnosticarNoCodigo() {
    setCarregandoDiagnostico(true);
    setErroDiagnostico(null);
    try {
      const res = await fetch("/api/ia/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamadoId }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro ?? "IA indisponível, tente novamente.");
      setDiagnostico(dados.resultado);
    } catch (err) {
      setErroDiagnostico(err instanceof Error ? err.message : "IA indisponível, tente novamente.");
    } finally {
      setCarregandoDiagnostico(false);
    }
  }

  async function copiarSugestao() {
    if (!sugestao) return;
    await navigator.clipboard.writeText(sugestao.sugestao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" className="w-full" onClick={analisarComIA} disabled={carregandoSugestao}>
        {carregandoSugestao ? "Analisando..." : "Analisar com IA"}
      </Button>
      {erroSugestao && <p className="text-xs text-destructive">{erroSugestao}</p>}
      {sugestao && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sugestão da IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="whitespace-pre-wrap text-sm">{sugestao.sugestao}</p>
            <Button size="sm" variant="secondary" onClick={copiarSugestao}>
              {copiado ? "Copiado!" : "Copiar como resposta"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={diagnosticarNoCodigo}
        disabled={carregandoDiagnostico}
      >
        {carregandoDiagnostico ? "Diagnosticando..." : "Diagnosticar no código"}
      </Button>
      {erroDiagnostico && <p className="text-xs text-destructive">{erroDiagnostico}</p>}
      {diagnostico && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Diagnóstico no código</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Arquivos suspeitos</p>
              <ul className="mt-1 space-y-1">
                {diagnostico.arquivos_suspeitos.map((a, i) => (
                  <li key={i} className="rounded bg-muted p-2 font-mono text-xs">
                    {a.caminho}
                    {a.linhas ? `:${a.linhas}` : ""}
                    <p className="mt-1 font-sans text-muted-foreground">{a.motivo}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Causa provável</p>
              <p className="text-muted-foreground">{diagnostico.causa_provavel}</p>
            </div>
            <div>
              <p className="font-medium">Correção sugerida</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
                {diagnostico.correcao_sugerida}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
