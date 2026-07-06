-- Funções auxiliares para RLS (SECURITY DEFINER evita recursão ao consultar profiles)
-- e trigger que cria o profile automaticamente quando um usuário se cadastra no Auth.

create or replace function public.get_my_papel()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select papel from profiles where id = auth.uid();
$$;

create or replace function public.get_my_empresa_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select empresa_id from profiles where id = auth.uid();
$$;

-- true se o técnico (júnior) autenticado tem a empresa liberada em atribuicoes
create or replace function public.tecnico_tem_acesso_empresa(p_empresa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from atribuicoes
    where empresa_id = p_empresa_id
      and tecnico_id = auth.uid()
  );
$$;

-- true se o usuário autenticado tem acesso ao chamado (por papel)
create or replace function public.tem_acesso_chamado(p_chamado_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case get_my_papel()
    when 'admin' then true
    when 'tecnico_senior' then true
    when 'tecnico_junior' then exists (
      select 1 from chamados c
      where c.id = p_chamado_id
        and tecnico_tem_acesso_empresa(c.empresa_id)
    )
    when 'cliente_gestor' then exists (
      select 1 from chamados c
      where c.id = p_chamado_id
        and c.empresa_id = get_my_empresa_id()
    )
    when 'cliente_usuario' then exists (
      select 1 from chamados c
      where c.id = p_chamado_id
        and c.aberto_por = auth.uid()
    )
    else false
  end;
$$;

-- cria o profile a partir dos metadados enviados no signup/admin.createUser
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel, empresa_id, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'papel', 'cliente_usuario'),
    nullif(new.raw_user_meta_data->>'empresa_id', '')::uuid,
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
