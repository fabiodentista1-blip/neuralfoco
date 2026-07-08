-- Tabela de configurações gerais (singleton). Por enquanto só o toggle de IA;
-- a Etapa 5 adiciona o campo de webhook do n8n na mesma tabela.
create table configuracoes (
  id uuid primary key default gen_random_uuid(),
  ia_ativa boolean not null default false,
  webhook_n8n_url text,
  atualizado_em timestamptz not null default now()
);

insert into configuracoes (ia_ativa) values (false);

alter table configuracoes enable row level security;

create policy "admin gerencia configuracoes" on configuracoes
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

grant select, insert, update, delete on configuracoes to authenticated, service_role;
