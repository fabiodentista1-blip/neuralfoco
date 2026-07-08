import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient, iaEstaAtiva, IA_MODEL } from "@/lib/ia/anthropic";
import { buscarArquivosRelevantes } from "@/lib/github/repo";

const DIAGNOSTICO_SCHEMA = {
  type: "object",
  properties: {
    arquivos_suspeitos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          caminho: { type: "string" },
          linhas: { type: "string" },
          motivo: { type: "string" },
        },
        required: ["caminho", "motivo"],
        additionalProperties: false,
      },
    },
    causa_provavel: { type: "string" },
    correcao_sugerida: {
      type: "string",
      description: "Correção sugerida em passos ou diff, em markdown",
    },
  },
  required: ["arquivos_suspeitos", "causa_provavel", "correcao_sugerida"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chamadoId = body?.chamadoId as string | undefined;
  if (!chamadoId) {
    return NextResponse.json({ erro: "chamadoId é obrigatório." }, { status: 400 });
  }

  if (!(await iaEstaAtiva())) {
    return NextResponse.json({ erro: "IA indisponível, tente novamente mais tarde." }, { status: 503 });
  }
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json(
      { erro: "Nenhum GITHUB_TOKEN configurado — diagnóstico no código indisponível." },
      { status: 503 }
    );
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

    const { data: repositorio } = await supabase
      .from("cliente_repositorios")
      .select("*")
      .eq("empresa_id", chamado.empresa_id)
      .limit(1)
      .maybeSingle();

    if (!repositorio) {
      return NextResponse.json(
        { erro: "Nenhum repositório vinculado a esta empresa." },
        { status: 404 }
      );
    }

    const termos = `${chamado.titulo} ${chamado.descricao ?? ""} ${chamado.categoria ?? ""}`.split(/\s+/);
    const arquivos = await buscarArquivosRelevantes(repositorio.repo_url, repositorio.branch_padrao, termos);

    if (arquivos.length === 0) {
      return NextResponse.json(
        { erro: "Não encontrei arquivos relevantes no repositório para esse chamado." },
        { status: 404 }
      );
    }

    const contextoCodigo = arquivos
      .map((a) => `### ${a.caminho}\n\`\`\`\n${a.conteudo}\n\`\`\``)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: DIAGNOSTICO_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Bug relatado por um cliente de suporte técnico:\nTítulo: ${chamado.titulo}\nDescrição: ${chamado.descricao ?? "(sem descrição)"}\n\nTrechos de código relevantes do repositório vinculado:\n\n${contextoCodigo}\n\nAponte os arquivos suspeitos, a causa provável e uma correção sugerida (em passos ou diff). NÃO aplique nada — apenas diagnostique.`,
        },
      ],
    });

    const bloco = response.content.find((b) => b.type === "text");
    if (!bloco || bloco.type !== "text") throw new Error("Resposta da IA sem conteúdo de texto.");
    const resultado = JSON.parse(bloco.text);

    await supabase.from("ia_analises").insert({
      chamado_id: chamadoId,
      tipo: "diagnostico_codigo",
      conteudo: resultado,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
    });

    return NextResponse.json({ resultado });
  } catch (err) {
    console.error("Erro no diagnóstico de IA:", err);
    return NextResponse.json({ erro: "IA indisponível, tente novamente." }, { status: 500 });
  }
}
