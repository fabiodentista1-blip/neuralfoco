"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, PrioridadeBadge } from "@/components/chamados/status-badge";
import { AnexosPicker } from "@/components/chamados/anexos-picker";
import { AnexoThumb } from "@/components/chamados/anexo-thumb";
import { createClient } from "@/lib/supabase/client";
import { enviarAnexos } from "@/lib/chamados-upload";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Chamado = Database["public"]["Tables"]["chamados"]["Row"];
type Mensagem = Database["public"]["Tables"]["mensagens"]["Row"];
type Anexo = Database["public"]["Tables"]["anexos"]["Row"];

export default function ChamadoDetalhePage() {
  const params = useParams<{ id: string }>();
  const chamadoId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [resposta, setResposta] = useState("");
  const [anexosResposta, setAnexosResposta] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);

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

    setUserId(userData.user?.id ?? null);

    if (chamadoRes.error || !chamadoRes.data) {
      setErro("Chamado não encontrado.");
      setCarregando(false);
      return;
    }
    setChamado(chamadoRes.data);
    setMensagens(mensagensRes.data ?? []);
    setAnexos(anexosRes.data ?? []);

    const idsPerfis = Array.from(
      new Set(
        [chamadoRes.data.aberto_por, chamadoRes.data.atribuido_a, ...(mensagensRes.data ?? []).map((m) => m.autor_id)].filter(
          (v): v is string => Boolean(v)
        )
      )
    );
    if (idsPerfis.length) {
      const { data: perfis } = await supabase.from("profiles").select("id, nome").in("id", idsPerfis);
      setNomes(Object.fromEntries((perfis ?? []).map((p) => [p.id, p.nome])));
    }

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
          if (!nomes[nova.autor_id]) {
            supabase
              .from("profiles")
              .select("id, nome")
              .eq("id", nova.autor_id)
              .single()
              .then(({ data }) => {
                if (data) setNomes((atual) => ({ ...atual, [data.id]: data.nome }));
              });
          }
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
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  async function handleEnviarResposta(e: FormEvent) {
    e.preventDefault();
    if (!resposta.trim() && anexosResposta.length === 0) return;
    setEnviando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data: mensagem, error } = await supabase
        .from("mensagens")
        .insert({
          chamado_id: chamadoId,
          autor_id: user.id,
          conteudo: resposta.trim() || "(anexo)",
          interno: false,
        })
        .select()
        .single();
      if (error || !mensagem) throw error ?? new Error("Falha ao enviar mensagem.");

      setMensagens((atual) => (atual.some((m) => m.id === mensagem.id) ? atual : [...atual, mensagem]));

      if (anexosResposta.length) {
        await enviarAnexos({ chamadoId, mensagemId: mensagem.id, arquivos: anexosResposta });
      }

      setResposta("");
      setAnexosResposta([]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar resposta.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleReabrir() {
    const { error } = await supabase.from("chamados").update({ status: "aberto" }).eq("id", chamadoId);
    if (!error) setChamado((atual) => (atual ? { ...atual, status: "aberto" } : atual));
  }

  if (carregando) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;
  }
  if (erro && !chamado) {
    return <div className="p-8 text-sm text-destructive">{erro}</div>;
  }
  if (!chamado) return null;

  const anexosIniciais = anexos.filter((a) => !a.mensagem_id);
  const anexosPorMensagem = (mensagemId: string) => anexos.filter((a) => a.mensagem_id === mensagemId);

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-8">
      <div className="mb-4 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{chamado.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              Responsável: {chamado.atribuido_a ? nomes[chamado.atribuido_a] ?? "—" : "Ainda não atribuído"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PrioridadeBadge prioridade={chamado.prioridade} />
            <StatusBadge status={chamado.status} />
          </div>
        </div>
        {chamado.descricao && <p className="mt-2 text-sm">{chamado.descricao}</p>}
        {anexosIniciais.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {anexosIniciais.map((a) => (
              <AnexoThumb key={a.id} storagePath={a.storage_path} />
            ))}
          </div>
        )}
        {chamado.status === "fechado" && (
          <Button variant="outline" size="sm" className="mt-3" onClick={handleReabrir}>
            Reabrir chamado
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {mensagens.map((m) => {
          const propria = m.autor_id === userId;
          return (
            <div key={m.id} className={cn("flex", propria ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  propria ? "bg-primary text-primary-foreground" : "bg-muted"
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

      <form onSubmit={handleEnviarResposta} className="mt-4 space-y-2 border-t pt-4">
        <Textarea
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          placeholder="Escreva sua resposta..."
          rows={3}
        />
        <AnexosPicker value={anexosResposta} onChange={setAnexosResposta} />
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
