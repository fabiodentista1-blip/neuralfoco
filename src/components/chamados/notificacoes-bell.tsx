"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Notificacao = Database["public"]["Tables"]["notificacoes"]["Row"];

const TIPO_LABEL: Record<string, string> = {
  escalonamento: "Pedido de ajuda",
  cliente_respondeu: "Cliente respondeu",
  chamado_atribuido: "Novo chamado atribuído",
};

export function NotificacoesBell() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!id) return;
      supabase
        .from("notificacoes")
        .select("*")
        .eq("usuario_id", id)
        .order("criado_em", { ascending: false })
        .limit(20)
        .then(({ data: rows }) => setNotificacoes(rows ?? []));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    const canal = supabase
      .channel(`notificacoes:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${userId}` },
        (payload) => {
          setNotificacoes((atual) => [payload.new as Notificacao, ...atual]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const naoLidas = notificacoes.filter((n) => !n.lido).length;

  async function marcarComoLida(id: string) {
    setNotificacoes((atual) => atual.map((n) => (n.id === id ? { ...n, lido: true } : n)));
    await supabase.from("notificacoes").update({ lido: true }).eq("id", id);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            {naoLidas > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                {naoLidas}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-96 overflow-y-auto">
          {notificacoes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Sem notificações.</p>
          )}
          {notificacoes.map((n) => (
            <Link
              key={n.id}
              href={n.chamado_id ? `/chamados/${n.chamado_id}` : "#"}
              onClick={() => !n.lido && marcarComoLida(n.id)}
              className={`block border-b p-3 text-sm hover:bg-muted/50 ${n.lido ? "" : "bg-muted/30 font-medium"}`}
            >
              <p>{TIPO_LABEL[n.tipo] ?? n.tipo}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.criado_em).toLocaleString("pt-BR")}
              </p>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
