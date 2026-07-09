import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CORES = {
  teal: "bg-teal-50 text-teal-600",
  azul: "bg-blue-50 text-blue-600",
  verde: "bg-emerald-50 text-emerald-600",
  ambar: "bg-amber-50 text-amber-600",
  vermelho: "bg-red-50 text-red-600",
  roxo: "bg-purple-50 text-purple-600",
} as const;

export function CardMetrica({
  titulo,
  valor,
  icon: Icon,
  cor = "teal",
}: {
  titulo: string;
  valor: string | number;
  icon: LucideIcon;
  cor?: keyof typeof CORES;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", CORES[cor])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}
