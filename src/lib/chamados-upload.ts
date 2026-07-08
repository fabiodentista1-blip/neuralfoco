import { createClient } from "@/lib/supabase/client";

export async function enviarAnexos(params: {
  chamadoId: string;
  mensagemId?: string | null;
  arquivos: File[];
}) {
  const supabase = createClient();

  for (const arquivo of params.arquivos) {
    const path = `${params.chamadoId}/${crypto.randomUUID()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("anexos-chamados")
      .upload(path, arquivo);
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("anexos").insert({
      chamado_id: params.chamadoId,
      mensagem_id: params.mensagemId ?? null,
      storage_path: path,
      tipo: arquivo.type,
    });
    if (insertError) throw insertError;
  }
}
