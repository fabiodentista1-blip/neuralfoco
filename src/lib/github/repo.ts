const IGNORAR = [
  /node_modules\//,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp4|zip|pdf)$/i,
  /(^|\/)dist\//,
  /(^|\/)\.next\//,
  /(^|\/)build\//,
];

function parseRepoUrl(url: string) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (!match) throw new Error("URL de repositório inválida.");
  return { owner: match[1], repo: match[2] };
}

async function githubFetch(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} em ${path}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Baixa a árvore de arquivos do repo, prioriza os que têm relação com os
 * termos do chamado, e retorna o conteúdo de até ~50k tokens (estimado em
 * caracteres) dos arquivos mais relevantes.
 */
export async function buscarArquivosRelevantes(repoUrl: string, branch: string, termos: string[]) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

  const caminhos = (tree.tree as { path: string; type: string }[])
    .filter((f) => f.type === "blob")
    .map((f) => f.path)
    .filter((p) => !IGNORAR.some((re) => re.test(p)));

  const termosLower = termos
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 2);

  const pontuados = caminhos
    .map((caminho) => {
      const caminhoLower = caminho.toLowerCase();
      const pontos = termosLower.filter((t) => caminhoLower.includes(t)).length;
      return { caminho, pontos };
    })
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 15);

  const arquivos: { caminho: string; conteudo: string }[] = [];
  let orcamentoCaracteres = 50_000 * 4; // ~4 caracteres por token

  for (const { caminho } of pontuados) {
    if (orcamentoCaracteres <= 0) break;
    try {
      const dados = await githubFetch(
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(caminho)}?ref=${branch}`
      );
      if (dados.encoding !== "base64" || !dados.content) continue;
      const conteudo = Buffer.from(dados.content, "base64").toString("utf-8");
      const recorte = conteudo.slice(0, orcamentoCaracteres);
      arquivos.push({ caminho, conteudo: recorte });
      orcamentoCaracteres -= recorte.length;
    } catch {
      continue;
    }
  }

  return arquivos;
}
