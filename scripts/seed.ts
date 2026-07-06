import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database, Papel } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env.local (rode `supabase start` primeiro)."
  );
}

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SENHA_PADRAO = "neural123";

async function criarUsuario(params: {
  email: string;
  nome: string;
  papel: Papel;
  empresaId?: string;
}) {
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: SENHA_PADRAO,
    email_confirm: true,
    user_metadata: {
      nome: params.nome,
      papel: params.papel,
      empresa_id: params.empresaId ?? "",
    },
  });

  if (error) throw new Error(`Erro ao criar ${params.email}: ${error.message}`);
  if (!data.user) throw new Error(`Usuário não retornado para ${params.email}`);
  return data.user;
}

async function main() {
  console.log("Criando empresas de teste...");
  const { data: empresas, error: empresasError } = await admin
    .from("empresas_clientes")
    .insert([
      { nome: "Clínica Sorriso Feliz", plano: "essencial", status: "ativo" },
      { nome: "Método Infoprodutor", plano: "pro", status: "ativo" },
    ])
    .select();

  if (empresasError) throw empresasError;
  const [empresaClinica, empresaInfoprodutor] = empresas;

  console.log("Criando usuários internos (admin, tecnico_senior, tecnico_junior)...");
  await criarUsuario({ email: "fabio@neuralfoco.com.br", nome: "Fábio", papel: "admin" });
  const bruno = await criarUsuario({ email: "bruno@neuralfoco.com.br", nome: "Bruno", papel: "tecnico_senior" });
  const junior = await criarUsuario({ email: "junior@neuralfoco.com.br", nome: "Técnico Júnior", papel: "tecnico_junior" });

  console.log("Criando usuários da Clínica Sorriso Feliz (1 gestor único)...");
  await criarUsuario({
    email: "gestor@clinicasorriso.com.br",
    nome: "Gestora Clínica Sorriso",
    papel: "cliente_gestor",
    empresaId: empresaClinica.id,
  });

  console.log("Criando usuários do Método Infoprodutor (1 gestor + 2 usuários)...");
  await criarUsuario({
    email: "gestor@metodoinfoprodutor.com.br",
    nome: "Gestor Método Infoprodutor",
    papel: "cliente_gestor",
    empresaId: empresaInfoprodutor.id,
  });
  await criarUsuario({
    email: "usuario1@metodoinfoprodutor.com.br",
    nome: "Usuário 1 - Método Infoprodutor",
    papel: "cliente_usuario",
    empresaId: empresaInfoprodutor.id,
  });
  await criarUsuario({
    email: "usuario2@metodoinfoprodutor.com.br",
    nome: "Usuário 2 - Método Infoprodutor",
    papel: "cliente_usuario",
    empresaId: empresaInfoprodutor.id,
  });

  console.log("Liberando o Método Infoprodutor para o técnico júnior (supervisor: Bruno)...");
  const { error: atribuicaoError } = await admin.from("atribuicoes").insert({
    empresa_id: empresaInfoprodutor.id,
    tecnico_id: junior.id,
    supervisor_id: bruno.id,
  });
  if (atribuicaoError) throw atribuicaoError;

  console.log("\nSeed concluído. Senha padrão de todos os usuários: " + SENHA_PADRAO);
  console.log(`
  admin              fabio@neuralfoco.com.br
  tecnico_senior     bruno@neuralfoco.com.br
  tecnico_junior     junior@neuralfoco.com.br  (liberado só para o Método Infoprodutor)
  cliente_gestor     gestor@clinicasorriso.com.br
  cliente_gestor     gestor@metodoinfoprodutor.com.br
  cliente_usuario    usuario1@metodoinfoprodutor.com.br
  cliente_usuario    usuario2@metodoinfoprodutor.com.br
  `);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
