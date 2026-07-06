// Tipos manuais espelhando supabase/migrations/*.sql.
// Quando o banco local estiver rodando, substituir por:
//   npx supabase gen types typescript --local > src/types/database.ts

export type Papel =
  | "admin"
  | "tecnico_senior"
  | "tecnico_junior"
  | "cliente_gestor"
  | "cliente_usuario";

export type PrioridadeChamado = "baixa" | "media" | "alta" | "critica";

export type StatusChamado =
  | "aberto"
  | "triado"
  | "em_atendimento"
  | "aguardando_cliente"
  | "escalado"
  | "resolvido"
  | "fechado";

export type NivelResolucao = "sozinho" | "com_ia" | "com_bruno";

export type TipoAnaliseIA = "triagem" | "sugestao" | "diagnostico_codigo";

export interface Database {
  public: {
    Tables: {
      empresas_clientes: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          contato: string | null;
          whatsapp: string | null;
          plano: string | null;
          status: string;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["empresas_clientes"]["Row"]> & {
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas_clientes"]["Row"]>;
      };
      cliente_repositorios: {
        Row: {
          id: string;
          empresa_id: string;
          repo_url: string;
          branch_padrao: string;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cliente_repositorios"]["Row"]> & {
          empresa_id: string;
          repo_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["cliente_repositorios"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          nome: string;
          papel: Papel;
          empresa_id: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          nome: string;
          papel: Papel;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      atribuicoes: {
        Row: {
          id: string;
          empresa_id: string;
          tecnico_id: string;
          supervisor_id: string | null;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["atribuicoes"]["Row"]> & {
          empresa_id: string;
          tecnico_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["atribuicoes"]["Row"]>;
      };
      chamados: {
        Row: {
          id: string;
          empresa_id: string;
          aberto_por: string;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          prioridade: PrioridadeChamado;
          status: StatusChamado;
          atribuido_a: string | null;
          nivel_resolucao: NivelResolucao | null;
          criado_em: string;
          resolvido_em: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["chamados"]["Row"]> & {
          empresa_id: string;
          aberto_por: string;
          titulo: string;
        };
        Update: Partial<Database["public"]["Tables"]["chamados"]["Row"]>;
      };
      mensagens: {
        Row: {
          id: string;
          chamado_id: string;
          autor_id: string;
          conteudo: string;
          interno: boolean;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mensagens"]["Row"]> & {
          chamado_id: string;
          autor_id: string;
          conteudo: string;
        };
        Update: Partial<Database["public"]["Tables"]["mensagens"]["Row"]>;
      };
      anexos: {
        Row: {
          id: string;
          chamado_id: string;
          mensagem_id: string | null;
          storage_path: string;
          tipo: string | null;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["anexos"]["Row"]> & {
          chamado_id: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["anexos"]["Row"]>;
      };
      escalonamentos: {
        Row: {
          id: string;
          chamado_id: string;
          solicitado_por: string;
          atendido_por: string | null;
          motivo: string;
          criado_em: string;
          resolvido_em: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["escalonamentos"]["Row"]> & {
          chamado_id: string;
          solicitado_por: string;
          motivo: string;
        };
        Update: Partial<Database["public"]["Tables"]["escalonamentos"]["Row"]>;
      };
      notificacoes: {
        Row: {
          id: string;
          usuario_id: string;
          tipo: string;
          chamado_id: string | null;
          lido: boolean;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notificacoes"]["Row"]> & {
          usuario_id: string;
          tipo: string;
        };
        Update: Partial<Database["public"]["Tables"]["notificacoes"]["Row"]>;
      };
      ia_analises: {
        Row: {
          id: string;
          chamado_id: string;
          tipo: TipoAnaliseIA;
          conteudo: unknown;
          provider: string;
          tokens_input: number | null;
          tokens_output: number | null;
          criado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ia_analises"]["Row"]> & {
          chamado_id: string;
          tipo: TipoAnaliseIA;
          conteudo: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["ia_analises"]["Row"]>;
      };
    };
  };
}
