import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { alternarCategoria, criarCategoria, salvarConfiguracoes } from "@/app/admin/actions";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: config }] = await Promise.all([
    supabase.from("categorias_chamado").select("*").order("nome"),
    supabase.from("configuracoes").select("*").limit(1).maybeSingle(),
  ]);

  async function handleCriarCategoria(formData: FormData) {
    "use server";
    const nome = String(formData.get("nome") || "").trim();
    if (nome) await criarCategoria(nome);
  }

  async function handleAlternarCategoria(id: string, ativa: boolean) {
    "use server";
    await alternarCategoria(id, !ativa);
  }

  async function handleSalvarIA(formData: FormData) {
    "use server";
    await salvarConfiguracoes({ ia_ativa: formData.get("ia_ativa") === "on" });
  }

  async function handleSalvarWebhook(formData: FormData) {
    "use server";
    await salvarConfiguracoes({ webhook_n8n_url: String(formData.get("webhook_n8n_url") || "") || null });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inteligência Artificial</CardTitle>
          <CardDescription>
            Liga/desliga a triagem automática, sugestão de resolução e diagnóstico no código. Também precisa da
            variável de ambiente <code>ANTHROPIC_API_KEY</code> configurada no servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSalvarIA} className="flex items-center gap-3">
            <input type="checkbox" id="ia_ativa" name="ia_ativa" defaultChecked={config?.ia_ativa} className="size-4" />
            <Label htmlFor="ia_ativa">IA ativada</Label>
            <Button type="submit" size="sm" variant="outline">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas WhatsApp (n8n)</CardTitle>
          <CardDescription>
            URL de webhook que recebe eventos (novo chamado, escalonamento, resolvido) para disparar automações no
            seu n8n.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSalvarWebhook} className="flex gap-2">
            <Input
              name="webhook_n8n_url"
              placeholder="https://seu-n8n.com/webhook/..."
              defaultValue={config?.webhook_n8n_url ?? ""}
            />
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias de chamado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(categorias ?? []).map((c) => (
              <form key={c.id} action={handleAlternarCategoria.bind(null, c.id, c.ativa)}>
                <button type="submit">
                  <Badge variant={c.ativa ? "default" : "outline"}>{c.nome}</Badge>
                </button>
              </form>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Clique numa categoria pra ativar/desativar.</p>
          <form action={handleCriarCategoria} className="flex gap-2 border-t pt-3">
            <Input name="nome" placeholder="Nova categoria" required />
            <Button type="submit" variant="outline">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
