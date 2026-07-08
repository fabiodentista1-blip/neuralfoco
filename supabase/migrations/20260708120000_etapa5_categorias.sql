-- Categorias de chamado configuráveis pelo admin (Etapa 5), substituindo a
-- lista fixa que existia no frontend.
create table categorias_chamado (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

insert into categorias_chamado (nome) values
  ('Bug / erro no sistema'),
  ('Dúvida de uso'),
  ('Solicitação de melhoria'),
  ('Acesso / login'),
  ('Outro');

alter table categorias_chamado enable row level security;

create policy "admin gerencia categorias" on categorias_chamado
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "usuario ve categorias ativas" on categorias_chamado
  for select using (ativa = true or get_my_papel() = 'admin');

grant select, insert, update, delete on categorias_chamado to authenticated, service_role;
