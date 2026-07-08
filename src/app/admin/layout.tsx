import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b px-6 py-3">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin/desempenho" className="hover:underline">
            Desempenho
          </Link>
          <Link href="/admin/clientes" className="hover:underline">
            Clientes
          </Link>
          <Link href="/admin/usuarios" className="hover:underline">
            Usuários
          </Link>
          <Link href="/admin/atribuicoes" className="hover:underline">
            Atribuições
          </Link>
          <Link href="/admin/configuracoes" className="hover:underline">
            Configurações
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
