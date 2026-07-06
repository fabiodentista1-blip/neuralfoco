-- Neural Suporte — schema inicial
create extension if not exists "pgcrypto";

create table empresas_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  contato text,
  whatsapp text,
  plano text,
  status text not null default 'ativo',
  criado_em timestamptz not null default now()
);

create table cliente_repositorios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_clientes(id) on delete cascade,
  repo_url text not null,
  branch_padrao text not null default 'main',
  criado_em timestamptz not null default now()
);

-- espelha auth.users; papel controla o RBAC de toda a aplicação
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in (
    'admin', 'tecnico_senior', 'tecnico_junior', 'cliente_gestor', 'cliente_usuario'
  )),
  empresa_id uuid references empresas_clientes(id) on delete set null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table atribuicoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_clientes(id) on delete cascade,
  tecnico_id uuid not null references profiles(id) on delete cascade,
  supervisor_id uuid references profiles(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, tecnico_id)
);

create table chamados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_clientes(id) on delete cascade,
  aberto_por uuid not null references profiles(id),
  titulo text not null,
  descricao text,
  categoria text,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta', 'critica')),
  status text not null default 'aberto' check (status in (
    'aberto', 'triado', 'em_atendimento', 'aguardando_cliente', 'escalado', 'resolvido', 'fechado'
  )),
  atribuido_a uuid references profiles(id) on delete set null,
  nivel_resolucao text check (nivel_resolucao in ('sozinho', 'com_ia', 'com_bruno')),
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  autor_id uuid not null references profiles(id),
  conteudo text not null,
  interno boolean not null default false,
  criado_em timestamptz not null default now()
);

create table anexos (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  mensagem_id uuid references mensagens(id) on delete set null,
  storage_path text not null,
  tipo text,
  criado_em timestamptz not null default now()
);

create table escalonamentos (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  solicitado_por uuid not null references profiles(id),
  atendido_por uuid references profiles(id),
  motivo text not null,
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id) on delete cascade,
  tipo text not null,
  chamado_id uuid references chamados(id) on delete cascade,
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);

create table ia_analises (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  tipo text not null check (tipo in ('triagem', 'sugestao', 'diagnostico_codigo')),
  conteudo jsonb not null,
  provider text not null default 'anthropic',
  tokens_input integer,
  tokens_output integer,
  criado_em timestamptz not null default now()
);

create index idx_profiles_empresa on profiles(empresa_id);
create index idx_atribuicoes_tecnico on atribuicoes(tecnico_id);
create index idx_atribuicoes_empresa on atribuicoes(empresa_id);
create index idx_chamados_empresa on chamados(empresa_id);
create index idx_chamados_aberto_por on chamados(aberto_por);
create index idx_chamados_atribuido_a on chamados(atribuido_a);
create index idx_mensagens_chamado on mensagens(chamado_id);
create index idx_anexos_chamado on anexos(chamado_id);
create index idx_escalonamentos_chamado on escalonamentos(chamado_id);
create index idx_notificacoes_usuario on notificacoes(usuario_id);
create index idx_ia_analises_chamado on ia_analises(chamado_id);
