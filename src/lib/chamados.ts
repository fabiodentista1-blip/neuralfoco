import type { NivelResolucao, PrioridadeChamado, StatusChamado } from "@/types/database";

export const STATUS_LABELS: Record<StatusChamado, string> = {
  aberto: "Aberto",
  triado: "Triado",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando cliente",
  escalado: "Escalado",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export const STATUS_BADGE_CLASS: Record<StatusChamado, string> = {
  aberto: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  triado: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  em_atendimento: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  aguardando_cliente: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  escalado: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  resolvido: "bg-green-100 text-green-800 hover:bg-green-100",
  fechado: "bg-gray-200 text-gray-700 hover:bg-gray-200",
};

export const PRIORIDADE_LABELS: Record<PrioridadeChamado, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const PRIORIDADE_BADGE_CLASS: Record<PrioridadeChamado, string> = {
  baixa: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  media: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  alta: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  critica: "bg-red-100 text-red-700 hover:bg-red-100",
};

export const NIVEL_RESOLUCAO_LABELS: Record<NivelResolucao, string> = {
  sozinho: "Sozinho",
  com_ia: "Com ajuda da IA",
  com_bruno: "Com ajuda do Bruno",
};

export const STATUS_ABERTOS: StatusChamado[] = [
  "aberto",
  "triado",
  "em_atendimento",
  "aguardando_cliente",
  "escalado",
];
export const STATUS_FECHADOS: StatusChamado[] = ["resolvido", "fechado"];
