# Neural Suporte

Sistema de help desk da Neural Foco (empresa de tecnologia que atende clínicas
médicas/odontológicas e infoprodutores).

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime) — rodando LOCAL via `supabase start`
  (chaves em `.env.local`, geradas pelo próprio `supabase start`)
- IA: Anthropic API (Claude), server-side em route handlers
- Idioma da interface: português do Brasil
- Ambiente: 100% local por enquanto (sem deploy)

## Papéis (RBAC)
- **admin** (Fábio, dono): vê e configura tudo
- **tecnico_senior** (Bruno, sócio): vê todos os chamados, recebe escalonamentos
- **tecnico_junior**: vê SOMENTE chamados de clientes liberados pra ele na tabela
  de atribuições; pode pedir ajuda do Bruno (escalonamento)
- **cliente_gestor**: vê todos os chamados da empresa dele, convida usuários da empresa
- **cliente_usuario**: abre chamados e vê os que ele mesmo abriu

## Modelo de dados (Supabase / Postgres)
- `empresas_clientes` (nome, cnpj, contato, whatsapp, plano, status)
- `cliente_repositorios` (empresa_id, repo_url, branch_padrao)
- `usuarios` / `profiles` (vinculado a `auth.users`: nome, papel, empresa_id nullable, ativo)
- `atribuicoes` (empresa_id, tecnico_id, supervisor_id)
- `chamados` (empresa_id, aberto_por, titulo, descricao, categoria, prioridade
  [baixa|media|alta|critica], status [aberto|triado|em_atendimento|
  aguardando_cliente|escalado|resolvido|fechado], atribuido_a,
  nivel_resolucao [sozinho|com_ia|com_bruno] nullable, criado_em, resolvido_em)
- `mensagens` (chamado_id, autor_id, conteudo, interno boolean, criado_em)
- `anexos` (chamado_id, mensagem_id nullable, storage_path, tipo)
- `escalonamentos` (chamado_id, solicitado_por, atendido_por, motivo, criado_em, resolvido_em)
- `notificacoes` (usuario_id, tipo, chamado_id, lido, criado_em)
- `ia_analises` (chamado_id, tipo [triagem|sugestao|diagnostico_codigo], conteudo,
  provider, tokens_input, tokens_output, criado_em)

Row Level Security em TODAS as tabelas seguindo os papéis acima. A regra mais
importante: `tecnico_junior` só enxerga chamados de empresas presentes em
`atribuicoes` com `tecnico_id` = ele.

Bucket no Supabase Storage: `anexos-chamados` (privado).

## Estrutura de pastas
```
src/
├── app/
│   ├── (auth)/login/
│   ├── (cliente)/            ← portal do cliente
│   │   ├── chamados/
│   │   ├── chamados/novo/
│   │   └── chamados/[id]/
│   ├── (tecnico)/            ← área do Bruno e do júnior
│   │   ├── dashboard/
│   │   ├── fila/
│   │   ├── chamados/[id]/
│   │   └── escalados/
│   ├── (admin)/               ← área do Fábio
│   │   ├── clientes/
│   │   ├── usuarios/
│   │   ├── atribuicoes/
│   │   ├── desempenho/
│   │   └── configuracoes/
│   └── api/
│       ├── ia/analisar/
│       ├── ia/diagnostico/
│       └── webhooks/n8n/       ← stub Fase 1
├── components/                 ← shadcn/ui + componentes do produto
├── lib/
│   ├── supabase/                ← clients (browser/server)
│   ├── ia/                      ← chamadas à API da Anthropic
│   └── github/                  ← leitura de repositórios
└── types/
```

## Fluxo de trabalho
Construção dividida em etapas (fundação → portal do cliente → área do técnico →
IA → admin/desempenho). Não avançar para a próxima etapa com erro pendente.
Commitar no git ao final de cada etapa validada.

## Middleware / roteamento por papel
Após login, redirecionar: `cliente_*` → `/chamados`, `tecnico_*` → `/fila`,
`admin` → `/admin`.

## Notas de setup (não repetir esses erros)
- **Tailwind v4, não v3.** O `shadcn@latest` gera componentes com `@base-ui/react` e CSS
  (`@theme`, `@utility`) que só funcionam em Tailwind v4. O projeto foi migrado para v4
  (`@tailwindcss/postcss`, sem `tailwind.config.ts`, tema via `@theme inline` no
  `globals.css`). Não reintroduzir Tailwind v3.
- **`/admin` é uma pasta real** (`src/app/admin/`), não um route group `(admin)` — route
  groups não aparecem na URL, e a ETAPA 5 espera URLs `/admin/*`. `(cliente)` e `(tecnico)`
  continuam como route groups (sem prefixo), pois suas URLs (`/chamados`, `/fila`,
  `/dashboard`, `/escalados`) não levam prefixo.
- **`/chamados/[id]` é uma rota única compartilhada** entre cliente e técnico (a ser criada
  nas Etapas 2/3), não uma pasta duplicada em `(cliente)` e `(tecnico)` — isso causaria
  colisão de rota no Next.js.
- Seed: `npx tsx scripts/seed.ts` (precisa do `.env.local` preenchido após `supabase start`).
  Senha padrão de todos os usuários de teste: `neural123`.
