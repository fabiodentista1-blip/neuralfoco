"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpCircle,
  Building2,
  Inbox,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Area = "admin" | "tecnico" | "cliente";

interface ItemNav {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_POR_AREA: Record<Area, ItemNav[]> = {
  admin: [
    { href: "/admin/desempenho", label: "Desempenho", icon: LayoutDashboard },
    { href: "/admin/clientes", label: "Clientes", icon: Building2 },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/atribuicoes", label: "Atribuições", icon: Link2 },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ],
  tecnico: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fila", label: "Fila", icon: Inbox },
  ],
  cliente: [{ href: "/chamados", label: "Meus chamados", icon: MessageSquare }],
};

export function AppShell({
  area,
  mostrarEscalados,
  extra,
  children,
}: {
  area: Area;
  mostrarEscalados?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const itens = [...NAV_POR_AREA[area]];
  if (area === "tecnico" && mostrarEscalados) {
    itens.push({ href: "/escalados", label: "Escalados", icon: ArrowUpCircle });
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            NS
          </div>
          <span className="text-sm font-semibold leading-tight">
            Neural
            <br />
            Suporte
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {itens.map((item) => {
            const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {extra && (
          <header className="flex items-center justify-end border-b bg-background px-6 py-3">{extra}</header>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
