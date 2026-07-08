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

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      empresas_clientes: Table<
        {
          id: string;
          nome: string;
          cnpj: string | null;
          contato: string | null;
          whatsapp: string | null;
          plano: string | null;
          status: string;
          criado_em: string;
        },
        {
          id?: string;
          nome: string;
          cnpj?: string | null;
          contato?: string | null;
          whatsapp?: string | null;
          plano?: string | null;
          status?: string;
          criado_em?: string;
        },
        {
          id?: string;
          nome?: string;
          cnpj?: string | null;
          contato?: string | null;
          whatsapp?: string | null;
          plano?: string | null;
          status?: string;
          criado_em?: string;
        }
      >;
      cliente_repositorios: Table<
        {
          id: string;
          empresa_id: string;
          repo_url: string;
          branch_padrao: string;
          criado_em: string;
        },
        {
          id?: string;
          empresa_id: string;
          repo_url: string;
          branch_padrao?: string;
          criado_em?: string;
        },
        {
          id?: string;
          empresa_id?: string;
          repo_url?: string;
          branch_padrao?: string;
          criado_em?: string;
        }
      >;
      profiles: Table<
        {
          id: string;
          nome: string;
          papel: Papel;
          empresa_id: string | null;
          ativo: boolean;
          criado_em: string;
        },
        {
          id: string;
          nome: string;
          papel: Papel;
          empresa_id?: string | null;
          ativo?: boolean;
          criado_em?: string;
        },
        {
          id?: string;
          nome?: string;
          papel?: Papel;
          empresa_id?: string | null;
          ativo?: boolean;
          criado_em?: string;
        }
      >;
      atribuicoes: Table<
        {
          id: string;
          empresa_id: string;
          tecnico_id: string;
          supervisor_id: string | null;
          criado_em: string;
        },
        {
          id?: string;
          empresa_id: string;
          tecnico_id: string;
          supervisor_id?: string | null;
          criado_em?: string;
        },
        {
          id?: string;
          empresa_id?: string;
          tecnico_id?: string;
          supervisor_id?: string | null;
          criado_em?: string;
        }
      >;
      chamados: Table<
        {
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
        },
        {
          id?: string;
          empresa_id: string;
          aberto_por: string;
          titulo: string;
          descricao?: string | null;
          categoria?: string | null;
          prioridade?: PrioridadeChamado;
          status?: StatusChamado;
          atribuido_a?: string | null;
          nivel_resolucao?: NivelResolucao | null;
          criado_em?: string;
          resolvido_em?: string | null;
        },
        {
          id?: string;
          empresa_id?: string;
          aberto_por?: string;
          titulo?: string;
          descricao?: string | null;
          categoria?: string | null;
          prioridade?: PrioridadeChamado;
          status?: StatusChamado;
          atribuido_a?: string | null;
          nivel_resolucao?: NivelResolucao | null;
          criado_em?: string;
          resolvido_em?: string | null;
        }
      >;
      mensagens: Table<
        {
          id: string;
          chamado_id: string;
          autor_id: string;
          conteudo: string;
          interno: boolean;
          criado_em: string;
        },
        {
          id?: string;
          chamado_id: string;
          autor_id: string;
          conteudo: string;
          interno?: boolean;
          criado_em?: string;
        },
        {
          id?: string;
          chamado_id?: string;
          autor_id?: string;
          conteudo?: string;
          interno?: boolean;
          criado_em?: string;
        }
      >;
      anexos: Table<
        {
          id: string;
          chamado_id: string;
          mensagem_id: string | null;
          storage_path: string;
          tipo: string | null;
          criado_em: string;
        },
        {
          id?: string;
          chamado_id: string;
          mensagem_id?: string | null;
          storage_path: string;
          tipo?: string | null;
          criado_em?: string;
        },
        {
          id?: string;
          chamado_id?: string;
          mensagem_id?: string | null;
          storage_path?: string;
          tipo?: string | null;
          criado_em?: string;
        }
      >;
      escalonamentos: Table<
        {
          id: string;
          chamado_id: string;
          solicitado_por: string;
          atendido_por: string | null;
          motivo: string;
          criado_em: string;
          resolvido_em: string | null;
        },
        {
          id?: string;
          chamado_id: string;
          solicitado_por: string;
          atendido_por?: string | null;
          motivo: string;
          criado_em?: string;
          resolvido_em?: string | null;
        },
        {
          id?: string;
          chamado_id?: string;
          solicitado_por?: string;
          atendido_por?: string | null;
          motivo?: string;
          criado_em?: string;
          resolvido_em?: string | null;
        }
      >;
      notificacoes: Table<
        {
          id: string;
          usuario_id: string;
          tipo: string;
          chamado_id: string | null;
          lido: boolean;
          criado_em: string;
        },
        {
          id?: string;
          usuario_id: string;
          tipo: string;
          chamado_id?: string | null;
          lido?: boolean;
          criado_em?: string;
        },
        {
          id?: string;
          usuario_id?: string;
          tipo?: string;
          chamado_id?: string | null;
          lido?: boolean;
          criado_em?: string;
        }
      >;
      ia_analises: Table<
        {
          id: string;
          chamado_id: string;
          tipo: TipoAnaliseIA;
          conteudo: unknown;
          provider: string;
          tokens_input: number | null;
          tokens_output: number | null;
          criado_em: string;
        },
        {
          id?: string;
          chamado_id: string;
          tipo: TipoAnaliseIA;
          conteudo: unknown;
          provider?: string;
          tokens_input?: number | null;
          tokens_output?: number | null;
          criado_em?: string;
        },
        {
          id?: string;
          chamado_id?: string;
          tipo?: TipoAnaliseIA;
          conteudo?: unknown;
          provider?: string;
          tokens_input?: number | null;
          tokens_output?: number | null;
          criado_em?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
