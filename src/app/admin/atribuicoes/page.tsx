import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { salvarAtribuicao } from "@/app/admin/actions";

export default async function AtribuicoesPage() {
  const supabase = await createClient();

  const [{ data: empresas }, { data: tecnicos }, { data: atribuicoes }] = await Promise.all([
    supabase.from("empresas_clientes").select("id, nome").order("nome"),
    supabase.from("profiles").select("id, nome, papel").in("papel", ["tecnico_junior", "tecnico_senior"]),
    supabase.from("atribuicoes").select("*"),
  ]);

  const juniores = (tecnicos ?? []).filter((t) => t.papel === "tecnico_junior");
  const senior = (tecnicos ?? []).filter((t) => t.papel === "tecnico_senior");

  const atribuicaoPorEmpresa = new Map((atribuicoes ?? []).map((a) => [a.empresa_id, a]));

  async function handleSalvar(empresaId: string, formData: FormData) {
    "use server";
    const tecnicoId = String(formData.get("tecnico_id") || "");
    const supervisorId = String(formData.get("supervisor_id") || "");
    if (!tecnicoId) return;
    await salvarAtribuicao(empresaId, tecnicoId, supervisorId || null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Atribuições</h1>
      <p className="text-sm text-muted-foreground">
        Libere clientes para o técnico júnior atender, com o Bruno como supervisor.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(empresas ?? []).map((empresa) => {
            const atual = atribuicaoPorEmpresa.get(empresa.id);
            return (
              <TableRow key={empresa.id}>
                <TableCell>{empresa.nome}</TableCell>
                <TableCell colSpan={3}>
                  <form action={handleSalvar.bind(null, empresa.id)} className="flex items-center gap-2">
                    <select
                      name="tecnico_id"
                      defaultValue={atual?.tecnico_id ?? ""}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Nenhum</option>
                      {juniores.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="supervisor_id"
                      defaultValue={atual?.supervisor_id ?? ""}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Sem supervisor</option>
                      {senior.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm">
                      Salvar
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
