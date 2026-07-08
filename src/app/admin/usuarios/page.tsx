import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { atualizarUsuario, convidarUsuario } from "@/app/admin/actions";
import type { Papel } from "@/types/database";

const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Admin",
  tecnico_senior: "Técnico sênior",
  tecnico_junior: "Técnico júnior",
  cliente_gestor: "Gestor (cliente)",
  cliente_usuario: "Usuário (cliente)",
};

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*")
    .in("papel", ["admin", "tecnico_senior", "tecnico_junior"])
    .order("nome");

  async function handleConvidar(formData: FormData) {
    "use server";
    await convidarUsuario({
      email: String(formData.get("email")),
      nome: String(formData.get("nome")),
      papel: String(formData.get("papel")) as Papel,
    });
  }

  async function handleAlternarAtivo(id: string, ativo: boolean) {
    "use server";
    await atualizarUsuario(id, { ativo: !ativo });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Usuários internos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar usuário interno</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleConvidar} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="papel">Papel</Label>
              <select
                id="papel"
                name="papel"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="tecnico_junior"
              >
                <option value="admin">Admin</option>
                <option value="tecnico_senior">Técnico sênior</option>
                <option value="tecnico_junior">Técnico júnior</option>
              </select>
            </div>
            <div className="col-span-2">
              <Button type="submit">Enviar convite</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(usuarios ?? []).map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.nome}</TableCell>
              <TableCell>{PAPEL_LABEL[u.papel]}</TableCell>
              <TableCell>{u.ativo ? "Ativo" : "Inativo"}</TableCell>
              <TableCell>
                <form action={handleAlternarAtivo.bind(null, u.id, u.ativo)}>
                  <Button type="submit" variant="outline" size="sm">
                    {u.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
