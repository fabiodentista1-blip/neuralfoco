"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export function AnexoThumb({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    supabase.storage
      .from("anexos-chamados")
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data }) => {
        if (ativo && data) setUrl(data.signedUrl);
      });
    return () => {
      ativo = false;
    };
  }, [storagePath]);

  if (!url) {
    return <div className="size-20 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="block size-20 overflow-hidden rounded-md border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Anexo" className="h-full w-full object-cover" />
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Anexo</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Anexo" className="max-h-[80vh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
