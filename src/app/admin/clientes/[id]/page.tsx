import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { atualizarEmpresa, convidarUsuario, vincularRepositorio } from "@/app/admin/actions";

export default async function DetalheClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: empresa }, { data: repo }, { data: usuarios }] = await Promise.all([
    supabase.from("empresas_clientes").select("*").eq("id", id).single(),
    supabase.from("cliente_repositorios").select("*").eq("empresa_id", id).maybeSingle(),
    supabase.from("profiles").select("*").eq("empresa_id", id).order("nome"),
  ]);

  if (!empresa) {
    return <div className="p-8 text-sm text-destructive">Empresa não encontrada.</div>;
  }

  async function handleAtualizarEmpresa(formData: FormData) {
    "use server";
    await atualizarEmpresa(id, {
      nome: String(formData.get("nome")),
      cnpj: String(formData.get("cnpj") || ""),
      contato: String(formData.get("contato") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      plano: String(formData.get("plano") || ""),
    });
  }

  async function handleVincularRepo(formData: FormData) {
    "use server";
    await vincularRepositorio(id, String(formData.get("repo_url")), String(formData.get("branch_padrao") || "main"));
  }

  async function handleConvidar(formData: FormData) {
    "use server";
    await convidarUsuario({
      email: String(formData.get("email")),
      nome: String(formData.get("nome")),
      papel: (String(formData.get("papel")) || "cliente_usuario") as "cliente_gestor" | "cliente_usuario",
      empresaId: id,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">{empresa.nome}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleAtualizarEmpresa} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={empresa.nome} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={empresa.cnpj ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plano">Plano</Label>
              <Input id="plano" name="plano" defaultValue={empresa.plano ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contato">Contato</Label>
              <Input id="contato" name="contato" defaultValue={empresa.contato ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={empresa.whatsapp ?? ""} />
            </div>
            <div className="col-span-2">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repositório GitHub</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleVincularRepo} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="repo_url">URL do repositório</Label>
              <Input
                id="repo_url"
                name="repo_url"
                placeholder="https://github.com/empresa/projeto"
                defaultValue={repo?.repo_url ?? ""}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="branch_padrao">Branch padrão</Label>
              <Input id="branch_padrao" name="branch_padrao" defaultValue={repo?.branch_padrao ?? "main"} />
            </div>
            <div className="col-span-2">
              <Button type="submit">Salvar repositório</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários da empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usuarios ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{u.papel}</TableCell>
                  <TableCell>{u.ativo ? "Sim" : "Não"}</TableCell>
                </TableRow>
              ))}
              {(usuarios ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
                    Nenhum usuário ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <form action={handleConvidar} className="grid grid-cols-2 gap-3 border-t pt-4">
            <div className="space-y-1">
              <Label htmlFor="conv-nome">Nome</Label>
              <Input id="conv-nome" name="nome" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="conv-email">Email</Label>
              <Input id="conv-email" name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="conv-papel">Papel</Label>
              <select
                id="conv-papel"
                name="papel"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="cliente_usuario"
              >
                <option value="cliente_gestor">Gestor</option>
                <option value="cliente_usuario">Usuário</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Convidar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
