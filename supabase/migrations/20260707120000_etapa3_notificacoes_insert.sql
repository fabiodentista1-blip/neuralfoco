-- Etapa 3 precisa que técnicos (e clientes, ao responder) consigam criar
-- notificações para outros usuários ligados ao mesmo chamado
-- (ex.: júnior pedindo ajuda do Bruno, cliente respondendo pro técnico).
create policy "usuario cria notificacoes ligadas a chamados com acesso" on notificacoes
  for insert with check (
    chamado_id is not null and tem_acesso_chamado(chamado_id)
  );

grant select, insert, update, delete on notificacoes, escalonamentos to authenticated, service_role;

alter publication supabase_realtime add table notificacoes;
alter publication supabase_realtime add table escalonamentos;
alter publication supabase_realtime add table chamados;
