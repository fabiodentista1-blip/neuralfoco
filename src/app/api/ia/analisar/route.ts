import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient, iaEstaAtiva, IA_MODEL } from "@/lib/ia/anthropic";
import type { PrioridadeChamado } from "@/types/database";

const TRIAGEM_SCHEMA = {
  type: "object",
  properties: {
    categoria_sugerida: { type: "string" },
    prioridade_sugerida: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
    resumo: { type: "string" },
  },
  required: ["categoria_sugerida", "prioridade_sugerida", "resumo"],
  additionalProperties: false,
};

const SUGESTAO_SCHEMA = {
  type: "object",
  properties: {
    sugestao: {
      type: "string",
      description: "Passos numerados sugerindo como resolver o chamado, em markdown",
    },
  },
  required: ["sugestao"],
  additionalProperties: false,
};

async function baixarImagensBase64(
  supabase: ReturnType<typeof createAdminClient>,
  anexos: { storage_path: string; tipo: string | null }[]
) {
  const imagens: { mediaType: string; base64: string }[] = [];
  for (const anexo of anexos.slice(0, 4)) {
    const { data } = await supabase.storage.from("anexos-chamados").download(anexo.storage_path);
    if (!data) continue;
    const buffer = Buffer.from(await data.arrayBuffer());
    imagens.push({ mediaType: anexo.tipo || "image/jpeg", base64: buffer.toString("base64") });
  }
  return imagens;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chamadoId = body?.chamadoId as string | undefined;
  const tipo = body?.tipo as "triagem" | "sugestao" | undefined;

  if (!chamadoId || (tipo !== "triagem" && tipo !== "sugestao")) {
    return NextResponse.json({ erro: "Parâmetros inválidos." }, { status: 400 });
  }

  if (!(await iaEstaAtiva())) {
    return NextResponse.json({ erro: "IA indisponível, tente novamente mais tarde." }, { status: 503 });
  }

  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return NextResponse.json({ erro: "IA indisponível, tente novamente mais tarde." }, { status: 503 });
  }

  const supabase = createAdminClient();

  try {
    const { data: chamado } = await supabase.from("chamados").select("*").eq("id", chamadoId).single();
    if (!chamado) {
      return NextResponse.json({ erro: "Chamado não encontrado." }, { status: 404 });
    }

    if (tipo === "triagem") {
      const { data: anexos } = await supabase
        .from("anexos")
        .select("storage_path, tipo")
        .eq("chamado_id", chamadoId)
        .is("mensagem_id", null);

      const imagens = await baixarImagensBase64(supabase, anexos ?? []);

      const response = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: TRIAGEM_SCHEMA },
        },
        messages: [
          {
            role: "user",
            content: [
              ...imagens.map((img) => ({
                type: "image" as const,
                source: { type: "base64" as const, media_type: img.mediaType as "image/jpeg", data: img.base64 },
              })),
              {
                type: "text" as const,
                text: `Título: ${chamado.titulo}\n\nDescrição: ${chamado.descricao ?? "(sem descrição)"}\n\nClassifique este chamado de suporte técnico de uma empresa de tecnologia.`,
              },
            ],
          },
        ],
      });

      const bloco = response.content.find((b) => b.type === "text");
      if (!bloco || bloco.type !== "text") throw new Error("Resposta da IA sem conteúdo de texto.");
      const resultado = JSON.parse(bloco.text) as {
        categoria_sugerida: string;
        prioridade_sugerida: string;
        resumo: string;
      };

      await supabase.from("ia_analises").insert({
        chamado_id: chamadoId,
        tipo: "triagem",
        conteudo: resultado,
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
      });

      const atualizacoes: { prioridade: PrioridadeChamado; categoria?: string } = {
        prioridade: resultado.prioridade_sugerida as PrioridadeChamado,
      };
      if (!chamado.categoria) atualizacoes.categoria = resultado.categoria_sugerida;
      await supabase.from("chamados").update(atualizacoes).eq("id", chamadoId);

      return NextResponse.json({ resultado });
    }

    // tipo === "sugestao"
    const { data: mensagens } = await supabase
      .from("mensagens")
      .select("conteudo, interno")
      .eq("chamado_id", chamadoId)
      .order("criado_em", { ascending: true });

    const historico = (mensagens ?? [])
      .map((m) => `[${m.interno ? "nota interna" : "mensagem"}] ${m.conteudo}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SUGESTAO_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Título: ${chamado.titulo}\nDescrição: ${chamado.descricao ?? "(sem descrição)"}\n\nHistórico do chamado:\n${historico || "(sem mensagens ainda)"}\n\nVocê é um assistente de suporte técnico de uma empresa de tecnologia. Sugira, em passos numerados, como resolver esse chamado.`,
        },
      ],
    });

    const bloco = response.content.find((b) => b.type === "text");
    if (!bloco || bloco.type !== "text") throw new Error("Resposta da IA sem conteúdo de texto.");
    const resultado = JSON.parse(bloco.text) as { sugestao: string };

    await supabase.from("ia_analises").insert({
      chamado_id: chamadoId,
      tipo: "sugestao",
      conteudo: resultado,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
    });

    return NextResponse.json({ resultado });
  } catch (err) {
    console.error("Erro na análise de IA:", err);
    return NextResponse.json({ erro: "IA indisponível, tente novamente." }, { status: 500 });
  }
}
