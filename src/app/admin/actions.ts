"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/types/database";

async function urlDefinirSenha() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocolo = host?.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://${host}/definir-senha`;
}

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: profile } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (profile?.papel !== "admin") throw new Error("Apenas administradores podem fazer isso.");
}

// ===== Empresas =====

export async function criarEmpresa(params: {
  nome: string;
  cnpj?: string;
  contato?: string;
  whatsapp?: string;
  plano?: string;
}) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("empresas_clientes").insert({
    nome: params.nome,
    cnpj: params.cnpj || null,
    contato: params.contato || null,
    whatsapp: params.whatsapp || null,
    plano: params.plano || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clientes");
}

export async function atualizarEmpresa(
  id: string,
  params: { nome?: string; cnpj?: string; contato?: string; whatsapp?: string; plano?: string; status?: string }
) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("empresas_clientes").update(params).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
}

export async function vincularRepositorio(empresaId: string, repoUrl: string, branchPadrao: string) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { data: existente } = await admin
    .from("cliente_repositorios")
    .select("id")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (existente) {
    const { error } = await admin
      .from("cliente_repositorios")
      .update({ repo_url: repoUrl, branch_padrao: branchPadrao })
      .eq("id", existente.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("cliente_repositorios")
      .insert({ empresa_id: empresaId, repo_url: repoUrl, branch_padrao: branchPadrao });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/admin/clientes/${empresaId}`);
}

// ===== Usuários =====

export async function convidarUsuario(params: { email: string; nome: string; papel: Papel; empresaId?: string | null }) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(params.email, {
    data: {
      nome: params.nome,
      papel: params.papel,
      empresa_id: params.empresaId ?? "",
    },
    redirectTo: await urlDefinirSenha(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
  if (params.empresaId) revalidatePath(`/admin/clientes/${params.empresaId}`);
}

export async function atualizarUsuario(id: string, params: { papel?: Papel; ativo?: boolean; nome?: string }) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(params).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}

// ===== Atribuições =====

export async function salvarAtribuicao(empresaId: string, tecnicoId: string, supervisorId: string | null) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { data: existente } = await admin
    .from("atribuicoes")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("tecnico_id", tecnicoId)
    .maybeSingle();

  if (existente) {
    const { error } = await admin.from("atribuicoes").update({ supervisor_id: supervisorId }).eq("id", existente.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("atribuicoes")
      .insert({ empresa_id: empresaId, tecnico_id: tecnicoId, supervisor_id: supervisorId });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/atribuicoes");
}

export async function removerAtribuicao(id: string) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("atribuicoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/atribuicoes");
}

// ===== Categorias =====

export async function criarCategoria(nome: string) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("categorias_chamado").insert({ nome });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/configuracoes");
}

export async function alternarCategoria(id: string, ativa: boolean) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("categorias_chamado").update({ ativa }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/configuracoes");
}

// ===== Configurações =====

export async function salvarConfiguracoes(params: { ia_ativa?: boolean; webhook_n8n_url?: string | null }) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { data: config } = await admin.from("configuracoes").select("id").limit(1).maybeSingle();
  if (!config) throw new Error("Configuração não encontrada.");
  const { error } = await admin
    .from("configuracoes")
    .update({ ...params, atualizado_em: new Date().toISOString() })
    .eq("id", config.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/configuracoes");
}
