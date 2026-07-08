import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { criarEmpresa } from "@/app/admin/actions";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: empresas } = await supabase
    .from("empresas_clientes")
    .select("*")
    .order("nome", { ascending: true });

  async function handleCriar(formData: FormData) {
    "use server";
    await criarEmpresa({
      nome: String(formData.get("nome")),
      cnpj: String(formData.get("cnpj") || ""),
      contato: String(formData.get("contato") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      plano: String(formData.get("plano") || ""),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCriar} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plano">Plano</Label>
              <Input id="plano" name="plano" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contato">Contato</Label>
              <Input id="contato" name="contato" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" />
            </div>
            <div className="col-span-2">
              <Button type="submit">Criar empresa</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(empresas ?? []).map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.nome}</TableCell>
              <TableCell>{e.plano ?? "—"}</TableCell>
              <TableCell>{e.status}</TableCell>
              <TableCell>
                <Link href={`/admin/clientes/${e.id}`} className="text-sm text-primary hover:underline">
                  Ver detalhes
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
