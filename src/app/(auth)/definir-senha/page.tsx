"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setPronto(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Defina sua senha</CardTitle>
          <CardDescription>Escolha uma senha pra acessar o Neural Suporte.</CardDescription>
        </CardHeader>
        <CardContent>
          {!pronto ? (
            <p className="text-sm text-muted-foreground">
              Confirmando seu convite... se essa mensagem não sumir, o link pode ter expirado — peça um novo
              convite.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
              <Button type="submit" disabled={enviando} className="w-full">
                {enviando ? "Salvando..." : "Definir senha e entrar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
