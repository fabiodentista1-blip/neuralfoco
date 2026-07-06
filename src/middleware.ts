import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Papel } from "@/types/database";

const HOME_POR_PAPEL: Record<Papel, string> = {
  admin: "/admin",
  tecnico_senior: "/fila",
  tecnico_junior: "/fila",
  cliente_gestor: "/chamados",
  cliente_usuario: "/chamados",
};

function ehRotaAdmin(path: string) {
  return path.startsWith("/admin");
}
function ehRotaTecnico(path: string) {
  return ["/dashboard", "/fila", "/escalados"].some((p) => path.startsWith(p));
}
function ehRotaCliente(path: string) {
  return path.startsWith("/chamados");
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";

  if (!user) {
    if (!isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const papel = profile?.papel as Papel | undefined;
  const home = papel ? HOME_POR_PAPEL[papel] : "/login";

  if (isLoginPage || path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  const semAcesso =
    (ehRotaAdmin(path) && papel !== "admin") ||
    (ehRotaTecnico(path) && papel !== "tecnico_senior" && papel !== "tecnico_junior") ||
    (ehRotaCliente(path) && papel !== "cliente_gestor" && papel !== "cliente_usuario");

  if (semAcesso) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
