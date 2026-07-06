-- Row Level Security — todas as tabelas
alter table empresas_clientes enable row level security;
alter table cliente_repositorios enable row level security;
alter table profiles enable row level security;
alter table atribuicoes enable row level security;
alter table chamados enable row level security;
alter table mensagens enable row level security;
alter table anexos enable row level security;
alter table escalonamentos enable row level security;
alter table notificacoes enable row level security;
alter table ia_analises enable row level security;

-- ===== empresas_clientes =====
create policy "admin gerencia empresas" on empresas_clientes
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico_senior ve todas as empresas" on empresas_clientes
  for select using (get_my_papel() = 'tecnico_senior');

create policy "tecnico_junior ve empresas atribuidas" on empresas_clientes
  for select using (get_my_papel() = 'tecnico_junior' and tecnico_tem_acesso_empresa(id));

create policy "cliente ve a propria empresa" on empresas_clientes
  for select using (
    get_my_papel() in ('cliente_gestor', 'cliente_usuario') and id = get_my_empresa_id()
  );

-- ===== cliente_repositorios =====
create policy "admin gerencia repositorios" on cliente_repositorios
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico ve repositorios das empresas com acesso" on cliente_repositorios
  for select using (
    get_my_papel() = 'tecnico_senior'
    or (get_my_papel() = 'tecnico_junior' and tecnico_tem_acesso_empresa(empresa_id))
  );

-- ===== profiles =====
create policy "usuario ve o proprio profile" on profiles
  for select using (id = auth.uid());

create policy "usuario atualiza o proprio profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admin gerencia profiles" on profiles
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico_senior ve todos os profiles" on profiles
  for select using (get_my_papel() = 'tecnico_senior');

create policy "tecnico_junior ve profiles das empresas atribuidas" on profiles
  for select using (
    get_my_papel() = 'tecnico_junior'
    and empresa_id is not null
    and tecnico_tem_acesso_empresa(empresa_id)
  );

create policy "cliente_gestor ve profiles da propria empresa" on profiles
  for select using (
    get_my_papel() = 'cliente_gestor' and empresa_id = get_my_empresa_id()
  );

-- ===== atribuicoes =====
create policy "admin gerencia atribuicoes" on atribuicoes
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico_senior ve todas as atribuicoes" on atribuicoes
  for select using (get_my_papel() = 'tecnico_senior');

create policy "tecnico_junior ve as proprias atribuicoes" on atribuicoes
  for select using (get_my_papel() = 'tecnico_junior' and tecnico_id = auth.uid());

-- ===== chamados =====
create policy "admin gerencia chamados" on chamados
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico_senior ve e atualiza todos os chamados" on chamados
  for select using (get_my_papel() = 'tecnico_senior');
create policy "tecnico_senior atualiza todos os chamados" on chamados
  for update using (get_my_papel() = 'tecnico_senior');

create policy "tecnico_junior ve chamados das empresas atribuidas" on chamados
  for select using (get_my_papel() = 'tecnico_junior' and tecnico_tem_acesso_empresa(empresa_id));
create policy "tecnico_junior atualiza chamados das empresas atribuidas" on chamados
  for update using (get_my_papel() = 'tecnico_junior' and tecnico_tem_acesso_empresa(empresa_id));

create policy "cliente_gestor ve chamados da empresa" on chamados
  for select using (get_my_papel() = 'cliente_gestor' and empresa_id = get_my_empresa_id());
create policy "cliente_gestor abre chamados" on chamados
  for insert with check (
    get_my_papel() = 'cliente_gestor'
    and empresa_id = get_my_empresa_id()
    and aberto_por = auth.uid()
  );
create policy "cliente_gestor reabre chamados da empresa" on chamados
  for update using (get_my_papel() = 'cliente_gestor' and empresa_id = get_my_empresa_id());

create policy "cliente_usuario ve os proprios chamados" on chamados
  for select using (get_my_papel() = 'cliente_usuario' and aberto_por = auth.uid());
create policy "cliente_usuario abre chamados" on chamados
  for insert with check (
    get_my_papel() = 'cliente_usuario'
    and empresa_id = get_my_empresa_id()
    and aberto_por = auth.uid()
  );
create policy "cliente_usuario reabre os proprios chamados" on chamados
  for update using (get_my_papel() = 'cliente_usuario' and aberto_por = auth.uid());

-- ===== mensagens (clientes nunca veem interno = true) =====
create policy "admin acessa todas as mensagens" on mensagens
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico ve mensagens dos chamados com acesso" on mensagens
  for select using (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior') and tem_acesso_chamado(chamado_id)
  );
create policy "tecnico envia mensagens nos chamados com acesso" on mensagens
  for insert with check (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior')
    and tem_acesso_chamado(chamado_id)
    and autor_id = auth.uid()
  );

create policy "cliente ve mensagens publicas dos proprios chamados" on mensagens
  for select using (
    get_my_papel() in ('cliente_gestor', 'cliente_usuario')
    and interno = false
    and tem_acesso_chamado(chamado_id)
  );
create policy "cliente envia mensagens publicas nos proprios chamados" on mensagens
  for insert with check (
    get_my_papel() in ('cliente_gestor', 'cliente_usuario')
    and interno = false
    and tem_acesso_chamado(chamado_id)
    and autor_id = auth.uid()
  );

-- ===== anexos (mesma regra de visibilidade das mensagens) =====
create policy "admin acessa todos os anexos" on anexos
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico ve e envia anexos dos chamados com acesso" on anexos
  for all using (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior') and tem_acesso_chamado(chamado_id)
  ) with check (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior') and tem_acesso_chamado(chamado_id)
  );

create policy "cliente ve e envia anexos publicos dos proprios chamados" on anexos
  for all using (
    get_my_papel() in ('cliente_gestor', 'cliente_usuario')
    and tem_acesso_chamado(chamado_id)
    and (
      mensagem_id is null
      or exists (select 1 from mensagens m where m.id = mensagem_id and m.interno = false)
    )
  ) with check (
    get_my_papel() in ('cliente_gestor', 'cliente_usuario') and tem_acesso_chamado(chamado_id)
  );

-- ===== escalonamentos (só técnicos) =====
create policy "admin gerencia escalonamentos" on escalonamentos
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico_senior ve e resolve escalonamentos" on escalonamentos
  for select using (get_my_papel() = 'tecnico_senior');
create policy "tecnico_senior atualiza escalonamentos" on escalonamentos
  for update using (get_my_papel() = 'tecnico_senior');

create policy "tecnico_junior ve os proprios escalonamentos" on escalonamentos
  for select using (get_my_papel() = 'tecnico_junior' and solicitado_por = auth.uid());
create policy "tecnico_junior solicita escalonamento" on escalonamentos
  for insert with check (
    get_my_papel() = 'tecnico_junior'
    and solicitado_por = auth.uid()
    and tem_acesso_chamado(chamado_id)
  );

-- ===== notificacoes (cada usuário só vê as suas) =====
create policy "usuario ve as proprias notificacoes" on notificacoes
  for select using (usuario_id = auth.uid());
create policy "usuario marca as proprias notificacoes como lidas" on notificacoes
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "admin gerencia notificacoes" on notificacoes
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

-- ===== ia_analises (uso interno da equipe, clientes não têm acesso) =====
create policy "admin acessa todas as analises de ia" on ia_analises
  for all using (get_my_papel() = 'admin') with check (get_my_papel() = 'admin');

create policy "tecnico acessa analises de ia dos chamados com acesso" on ia_analises
  for all using (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior') and tem_acesso_chamado(chamado_id)
  ) with check (
    get_my_papel() in ('tecnico_senior', 'tecnico_junior') and tem_acesso_chamado(chamado_id)
  );
