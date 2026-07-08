import { Badge } from "@/components/ui/badge";
import {
  PRIORIDADE_BADGE_CLASS,
  PRIORIDADE_LABELS,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from "@/lib/chamados";
import type { PrioridadeChamado, StatusChamado } from "@/types/database";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: StatusChamado; className?: string }) {
  return (
    <Badge className={cn(STATUS_BADGE_CLASS[status], className)} variant="secondary">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PrioridadeBadge({
  prioridade,
  className,
}: {
  prioridade: PrioridadeChamado;
  className?: string;
}) {
  return (
    <Badge className={cn(PRIORIDADE_BADGE_CLASS[prioridade], className)} variant="secondary">
      {PRIORIDADE_LABELS[prioridade]}
    </Badge>
  );
}
