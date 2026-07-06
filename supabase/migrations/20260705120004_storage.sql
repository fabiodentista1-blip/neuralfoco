-- Bucket privado para anexos dos chamados.
-- Convenção de path: {chamado_id}/{arquivo}, usada pelas políticas abaixo.
insert into storage.buckets (id, name, public)
values ('anexos-chamados', 'anexos-chamados', false)
on conflict (id) do nothing;

create policy "admin acessa todos os anexos no storage" on storage.objects
  for all using (
    bucket_id = 'anexos-chamados' and get_my_papel() = 'admin'
  ) with check (
    bucket_id = 'anexos-chamados' and get_my_papel() = 'admin'
  );

create policy "tecnico acessa anexos no storage dos chamados com acesso" on storage.objects
  for all using (
    bucket_id = 'anexos-chamados'
    and get_my_papel() in ('tecnico_senior', 'tecnico_junior')
    and tem_acesso_chamado(((storage.foldername(name))[1])::uuid)
  ) with check (
    bucket_id = 'anexos-chamados'
    and get_my_papel() in ('tecnico_senior', 'tecnico_junior')
    and tem_acesso_chamado(((storage.foldername(name))[1])::uuid)
  );

create policy "cliente acessa anexos no storage dos proprios chamados" on storage.objects
  for all using (
    bucket_id = 'anexos-chamados'
    and get_my_papel() in ('cliente_gestor', 'cliente_usuario')
    and tem_acesso_chamado(((storage.foldername(name))[1])::uuid)
  ) with check (
    bucket_id = 'anexos-chamados'
    and get_my_papel() in ('cliente_gestor', 'cliente_usuario')
    and tem_acesso_chamado(((storage.foldername(name))[1])::uuid)
  );
