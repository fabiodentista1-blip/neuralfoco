-- Permite que qualquer usuário com acesso a um chamado veja o nome de quem
-- abriu, de quem está atribuído e de quem enviou mensagens nele (respeitando
-- a visibilidade de mensagens internas). Sem isso, o chat não consegue
-- mostrar o nome do técnico/cliente ao lado de cada mensagem.
create policy "usuario ve profiles envolvidos em chamados acessiveis" on profiles
  for select using (
    exists (
      select 1 from chamados c
      where tem_acesso_chamado(c.id)
        and (c.atribuido_a = profiles.id or c.aberto_por = profiles.id)
    )
    or exists (
      select 1 from mensagens m
      join chamados c on c.id = m.chamado_id
      where m.autor_id = profiles.id
        and tem_acesso_chamado(c.id)
        and (m.interno = false or get_my_papel() in ('admin', 'tecnico_senior', 'tecnico_junior'))
    )
  );

grant select, insert, update, delete on profiles to authenticated, service_role;

-- Habilita Realtime (chat sem reload) nas tabelas usadas pelo chat do chamado.
alter publication supabase_realtime add table mensagens;
alter publication supabase_realtime add table anexos;
