"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StatusBadge, PrioridadeBadge } from "@/components/chamados/status-badge";
import { AnexosPicker } from "@/components/chamados/anexos-picker";
import { AnexoThumb } from "@/components/chamados/anexo-thumb";
import { PainelIA } from "@/components/chamados/painel-ia";
import {
  NIVEL_RESOLUCAO_LABELS,
  PRIORIDADE_LABELS,
  STATUS_LABELS,
} from "@/lib/chamados";
import { createClient } from "@/lib/supabase/client";
import { enviarAnexos } from "@/lib/chamados-upload";
import { cn } from "@/lib/utils";
import type {
  Database,
  NivelResolucao,
  Papel,
  PrioridadeChamado,
  StatusChamado,
} from "@/types/database";

type Chamado = Database["public"]["Tables"]["chamados"]["Row"];
type Mensagem = Database["public"]["Tables"]["mensagens"]["Row"];
type Anexo = Database["public"]["Tables"]["anexos"]["Row"];

export default function ChamadoDetalhePage() {
  const params = useParams<{ id: string }>();
  const chamadoId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<"cliente" | "interno">("cliente");

  const [modalEscalonar, setModalEscalonar] = useState(false);
  const [motivoEscalonamento, setMotivoEscalonamento] = useState("");

  const [modalResolver, setModalResolver] = useState(false);
  const [temEscalonamento, setTemEscalonamento] = useState(false);
  const [nivelResolucao, setNivelResolucao] = useState<NivelResolucao>("sozinho");

  const isTecnicoOuAdmin = papel === "tecnico_senior" || papel === "tecnico_junior" || papel === "admin";
  const isJunior = papel === "tecnico_junior";

  async function buscarNomes(ids: (string | null | undefined)[]) {
    const idsUnicos = Array.from(new Set(ids.filter((v): v is string => Boolean(v))));
    const faltando = idsUnicos.filter((id) => !nomes[id]);
    if (!faltando.length) return;
    const { data } = await supabase.from("profiles").select("id, nome").in("id", faltando);
    if (data?.length) {
      setNomes((atual) => ({ ...atual, ...Object.fromEntries(data.map((p) => [p.id, p.nome])) }));
    }
  }

  async function carregarTudo() {
    const [{ data: userData }, chamadoRes, mensagensRes, anexosRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("chamados").select("*").eq("id", chamadoId).single(),
      supabase
        .from("mensagens")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("criado_em", { ascending: true }),
      supabase.from("anexos").select("*").eq("chamado_id", chamadoId),
    ]);

    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (uid) {
      const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", uid).single();
      setPapel((perfil?.papel as Papel) ?? null);
    }

    if (chamadoRes.error || !chamadoRes.data) {
      setErro("Chamado não encontrado.");
      setCarregando(false);
      return;
    }
    setChamado(chamadoRes.data);
    setMensagens(mensagensRes.data ?? []);
    setAnexos(anexosRes.data ?? []);

    await buscarNomes([
      chamadoRes.data.aberto_por,
      chamadoRes.data.atribuido_a,
      ...(mensagensRes.data ?? []).map((m) => m.autor_id),
    ]);

    setCarregando(false);
  }

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  useEffect(() => {
    const canal = supabase
      .channel(`chamado:${chamadoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `chamado_id=eq.${chamadoId}` },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((atual) => (atual.some((m) => m.id === nova.id) ? atual : [...atual, nova]));
          buscarNomes([nova.autor_id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anexos", filter: `chamado_id=eq.${chamadoId}` },
        (payload) => {
          const novo = payload.new as Anexo;
          setAnexos((atual) => (atual.some((a) => a.id === novo.id) ? atual : [...atual, novo]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chamados", filter: `id=eq.${chamadoId}` },
        (payload) => setChamado(payload.new as Chamado)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  async function enviarMensagem(conteudo: string, arquivos: File[], interno: boolean) {
    if (!userId || !chamado) return;
    const { data: mensagem, error } = await supabase
      .from("mensagens")
      .insert({
        chamado_id: chamadoId,
        autor_id: userId,
        conteudo: conteudo.trim() || "(anexo)",
        interno,
      })
      .select()
      .single();
    if (error || !mensagem) throw error ?? new Error("Falha ao enviar mensagem.");

    setMensagens((atual) => (atual.some((m) => m.id === mensagem.id) ? atual : [...atual, mensagem]));

    if (arquivos.length) {
      await enviarAnexos({ chamadoId, mensagemId: mensagem.id, arquivos });
    }

    if (!interno && !isTecnicoOuAdmin && chamado.atribuido_a) {
      await supabase.from("notificacoes").insert({
        usuario_id: chamado.atribuido_a,
        tipo: "cliente_respondeu",
        chamado_id: chamadoId,
      });
    }
  }

  async function handleReabrir() {
    const { error } = await supabase.from("chamados").update({ status: "aberto" }).eq("id", chamadoId);
    if (!error) setChamado((atual) => (atual ? { ...atual, status: "aberto" } : atual));
  }

  async function handleAssumir() {
    if (!userId || !chamado) return;
    const novoStatus: StatusChamado = chamado.status === "aberto" ? "em_atendimento" : chamado.status;
    const { error } = await supabase
      .from("chamados")
      .update({ atribuido_a: userId, status: novoStatus })
      .eq("id", chamadoId);
    if (!error) setChamado((atual) => (atual ? { ...atual, atribuido_a: userId, status: novoStatus } : atual));
  }

  async function handleAtualizarStatus(valor: StatusChamado) {
    const { error } = await supabase.from("chamados").update({ status: valor }).eq("id", chamadoId);
    if (!error) setChamado((atual) => (atual ? { ...atual, status: valor } : atual));
  }

  async function handleAtualizarPrioridade(valor: PrioridadeChamado) {
    const { error } = await supabase.from("chamados").update({ prioridade: valor }).eq("id", chamadoId);
    if (!error) setChamado((atual) => (atual ? { ...atual, prioridade: valor } : atual));
  }

  async function confirmarEscalonamento() {
    if (!userId || !chamado || !motivoEscalonamento.trim()) return;
    await supabase.from("escalonamentos").insert({
      chamado_id: chamadoId,
      solicitado_por: userId,
      motivo: motivoEscalonamento.trim(),
    });
    await supabase.from("chamados").update({ status: "escalado" }).eq("id", chamadoId);
    setChamado((atual) => (atual ? { ...atual, status: "escalado" } : atual));

    const { data: atribuicao } = await supabase
      .from("atribuicoes")
      .select("supervisor_id")
      .eq("empresa_id", chamado.empresa_id)
      .eq("tecnico_id", userId)
      .maybeSingle();

    if (atribuicao?.supervisor_id) {
      await supabase.from("notificacoes").insert({
        usuario_id: atribuicao.supervisor_id,
        tipo: "escalonamento",
        chamado_id: chamadoId,
      });
    }

    await enviarMensagem(motivoEscalonamento.trim(), [], true);
    fetch("/api/webhooks/n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento: "escalonamento", chamadoId, motivo: motivoEscalonamento.trim() }),
    }).catch(() => {});
    setMotivoEscalonamento("");
    setModalEscalonar(false);
    setAbaAtiva("interno");
  }

  async function abrirModalResolver() {
    const { count } = await supabase
      .from("escalonamentos")
      .select("id", { count: "exact", head: true })
      .eq("chamado_id", chamadoId);
    const houveEscalonamento = Boolean(count && count > 0);
    setTemEscalonamento(houveEscalonamento);
    setNivelResolucao(houveEscalonamento ? "com_bruno" : "sozinho");
    setModalResolver(true);
  }

  async function confirmarResolucao() {
    const { error } = await supabase
      .from("chamados")
      .update({ status: "resolvido", nivel_resolucao: nivelResolucao, resolvido_em: new Date().toISOString() })
      .eq("id", chamadoId);
    if (!error) {
      setChamado((atual) =>
        atual
          ? { ...atual, status: "resolvido", nivel_resolucao: nivelResolucao, resolvido_em: new Date().toISOString() }
          : atual
      );
      setModalResolver(false);
      fetch("/api/webhooks/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento: "resolvido", chamadoId, nivelResolucao }),
      }).catch(() => {});
    }
  }

  if (carregando) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;
  }
  if (erro && !chamado) {
    return <div className="p-8 text-sm text-destructive">{erro}</div>;
  }
  if (!chamado) return null;

  const anexosIniciais = anexos.filter((a) => !a.mensagem_id);
  const mensagensCliente = mensagens.filter((m) => !m.interno);
  const mensagensInternas = mensagens.filter((m) => m.interno);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-6 p-8">
      <div className="flex flex-1 flex-col">
        <div className="mb-4 border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{chamado.titulo}</h1>
              <p className="text-sm text-muted-foreground">
                Responsável: {chamado.atribuido_a ? nomes[chamado.atribuido_a] ?? "—" : "Ainda não atribuído"}
              </p>
            </div>
            {isTecnicoOuAdmin ? (
              <div className="flex items-center gap-2">
                <Select
                  value={chamado.prioridade}
                  onValueChange={(v) => v && handleAtualizarPrioridade(v as PrioridadeChamado)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORIDADE_LABELS) as [PrioridadeChamado, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={chamado.status} onValueChange={(v) => v && handleAtualizarStatus(v as StatusChamado)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_LABELS) as [StatusChamado, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <PrioridadeBadge prioridade={chamado.prioridade} />
                <StatusBadge status={chamado.status} />
              </div>
            )}
          </div>
          {chamado.descricao && <p className="mt-2 text-sm">{chamado.descricao}</p>}
          {anexosIniciais.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {anexosIniciais.map((a) => (
                <AnexoThumb key={a.id} storagePath={a.storage_path} />
              ))}
            </div>
          )}
          {!isTecnicoOuAdmin && chamado.status === "fechado" && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleReabrir}>
              Reabrir chamado
            </Button>
          )}
        </div>

        {isTecnicoOuAdmin ? (
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex gap-2 border-b">
              <button
                onClick={() => setAbaAtiva("cliente")}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium",
                  abaAtiva === "cliente" ? "border-primary" : "border-transparent text-muted-foreground"
                )}
              >
                Conversa com cliente
              </button>
              <button
                onClick={() => setAbaAtiva("interno")}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium",
                  abaAtiva === "interno" ? "border-primary" : "border-transparent text-muted-foreground"
                )}
              >
                Notas internas
              </button>
            </div>
            {abaAtiva === "cliente" ? (
              <Thread
                mensagens={mensagensCliente}
                anexos={anexos}
                nomes={nomes}
                userId={userId}
                onEnviar={(conteudo, arquivos) => enviarMensagem(conteudo, arquivos, false)}
              />
            ) : (
              <div>
                <p className="mb-2 rounded-md bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800">
                  interno — o cliente não vê
                </p>
                <Thread
                  mensagens={mensagensInternas}
                  anexos={anexos}
                  nomes={nomes}
                  userId={userId}
                  fundoBolha="bg-yellow-100"
                  onEnviar={(conteudo, arquivos) => enviarMensagem(conteudo, arquivos, true)}
                />
              </div>
            )}
          </div>
        ) : (
          <Thread
            mensagens={mensagensCliente}
            anexos={anexos}
            nomes={nomes}
            userId={userId}
            onEnviar={(conteudo, arquivos) => enviarMensagem(conteudo, arquivos, false)}
          />
        )}
      </div>

      {isTecnicoOuAdmin && (
        <div className="w-72 shrink-0 space-y-4 border-l pl-6">
          <div className="space-y-2">
            <p className="mb-2 text-sm font-medium">Ações</p>
            {chamado.atribuido_a !== userId && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleAssumir}>
                Assumir chamado
              </Button>
            )}
            {isJunior && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setModalEscalonar(true)}
              >
                Pedir ajuda do Bruno
              </Button>
            )}
            {chamado.status !== "resolvido" && chamado.status !== "fechado" && (
              <Button size="sm" className="w-full" onClick={abrirModalResolver}>
                Marcar como resolvido
              </Button>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Painel de IA</p>
            <PainelIA chamadoId={chamadoId} />
          </div>
        </div>
      )}

      <Dialog open={modalEscalonar} onOpenChange={setModalEscalonar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir ajuda do Bruno</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={4}
              value={motivoEscalonamento}
              onChange={(e) => setMotivoEscalonamento(e.target.value)}
              placeholder="Explique o que já foi tentado e por que precisa de ajuda"
            />
          </div>
          <DialogFooter>
            <Button onClick={confirmarEscalonamento} disabled={!motivoEscalonamento.trim()}>
              Enviar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalResolver} onOpenChange={setModalResolver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como esse chamado foi resolvido?</DialogTitle>
          </DialogHeader>
          <RadioGroup
            value={nivelResolucao}
            onValueChange={(v) => v && setNivelResolucao(v as NivelResolucao)}
          >
            {(Object.entries(NIVEL_RESOLUCAO_LABELS) as [NivelResolucao, string][]).map(([valor, label]) => {
              const desabilitado = temEscalonamento && valor === "sozinho";
              return (
                <label key={valor} className={cn("flex items-center gap-2 text-sm", desabilitado && "opacity-50")}>
                  <RadioGroupItem value={valor} disabled={desabilitado} />
                  {label}
                </label>
              );
            })}
          </RadioGroup>
          <DialogFooter>
            <Button onClick={confirmarResolucao}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Thread({
  mensagens,
  anexos,
  nomes,
  userId,
  onEnviar,
  fundoBolha,
}: {
  mensagens: Mensagem[];
  anexos: Anexo[];
  nomes: Record<string, string>;
  userId: string | null;
  onEnviar: (conteudo: string, arquivos: File[]) => Promise<void>;
  fundoBolha?: string;
}) {
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);

  const anexosPorMensagem = (mensagemId: string) => anexos.filter((a) => a.mensagem_id === mensagemId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim() && arquivos.length === 0) return;
    setEnviando(true);
    try {
      await onEnviar(texto, arquivos);
      setTexto("");
      setArquivos([]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {mensagens.map((m) => {
          const propria = m.autor_id === userId;
          return (
            <div key={m.id} className={cn("flex", propria ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  fundoBolha ?? (propria ? "bg-primary text-primary-foreground" : "bg-muted")
                )}
              >
                <p className="mb-1 text-xs font-medium opacity-70">{nomes[m.autor_id] ?? "Usuário"}</p>
                <p className="whitespace-pre-wrap">{m.conteudo}</p>
                {anexosPorMensagem(m.id).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {anexosPorMensagem(m.id).map((a) => (
                      <AnexoThumb key={a.id} storagePath={a.storage_path} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {mensagens.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t pt-4">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua mensagem..."
          rows={3}
        />
        <AnexosPicker value={arquivos} onChange={setArquivos} />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
