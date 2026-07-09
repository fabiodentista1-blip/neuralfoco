import { AppShell } from "@/components/layout/app-shell";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell area="cliente">{children}</AppShell>;
}
