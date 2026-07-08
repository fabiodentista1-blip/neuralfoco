import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Repassa eventos (novo_chamado, escalonamento, resolvido) pro webhook do n8n
 * configurado em /admin/configuracoes. Se não houver URL configurada, é um
 * no-op — a automação de verdade fica por conta do n8n do lado de fora.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.evento) {
    return NextResponse.json({ erro: "evento é obrigatório." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: config } = await supabase
    .from("configuracoes")
    .select("webhook_n8n_url")
    .limit(1)
    .maybeSingle();

  if (!config?.webhook_n8n_url) {
    return NextResponse.json({ ok: false, motivo: "Webhook n8n não configurado." });
  }

  try {
    await fetch(config.webhook_n8n_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Falha ao notificar webhook n8n:", err);
    return NextResponse.json({ ok: false, motivo: "Falha ao notificar webhook." });
  }
}
