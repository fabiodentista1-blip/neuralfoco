import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export const IA_MODEL = "claude-sonnet-5";

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * A IA só roda se o admin ativou o toggle em /admin/configuracoes
 * E a ANTHROPIC_API_KEY estiver configurada no ambiente.
 */
export async function iaEstaAtiva() {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("ia_ativa")
    .limit(1)
    .maybeSingle();
  return data?.ia_ativa ?? false;
}
