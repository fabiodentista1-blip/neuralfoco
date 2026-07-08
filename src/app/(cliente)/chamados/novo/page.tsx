"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnexosPicker } from "@/components/chamados/anexos-picker";
import { CATEGORIAS_CHAMADO } from "@/lib/chamados";
import { createClient } from "@/lib/supabase/client";
import { enviarAnexos } from "@/lib/chamados-upload";

export default function NovoChamadoPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [anexos, setAnexos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, faça login novamente.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", user.id)
        .single();
      if (profileError || !profile?.empresa_id) {
        throw new Error("Não foi possível identificar sua empresa.");
      }

      const { data: chamado, error: chamadoError } = await supabase
        .from("chamados")
        .insert({
          empresa_id: profile.empresa_id,
          aberto_por: user.id,
          titulo,
          descricao: descricao || null,
          categoria: categoria ?? null,
          status: "aberto",
        })
        .select()
        .single();
      if (chamadoError || !chamado) throw chamadoError ?? new Error("Falha ao criar chamado.");

      if (anexos.length) {
        await enviarAnexos({ chamadoId: chamado.id, arquivos: anexos });
      }

      // Triagem automática por IA — não bloqueia a criação do chamado se falhar.
      fetch("/api/ia/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamadoId: chamado.id, tipo: "triagem" }),
      }).catch(() => {});

      router.push(`/chamados/${chamado.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir o chamado.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Abrir novo chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={5}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o problema ou dúvida com o máximo de detalhes possível"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria (opcional)</Label>
              <Select
                value={categoria ?? null}
                onValueChange={(value) => setCategoria(value ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_CHAMADO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Imagens (opcional)</Label>
              <AnexosPicker value={anexos} onChange={setAnexos} />
            </div>

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando ? "Enviando..." : "Abrir chamado"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
