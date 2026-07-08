"use client";

import { useCallback, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnexosPickerProps {
  value: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export function AnexosPicker({ value, onChange, className }: AnexosPickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  const adicionarArquivos = useCallback(
    (novos: FileList | File[]) => {
      const imagens = Array.from(novos).filter((f) => f.type.startsWith("image/"));
      if (imagens.length) onChange([...value, ...imagens]);
    },
    [value, onChange]
  );

  const removerArquivo = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          adicionarArquivos(e.dataTransfer.files);
        }}
        onPaste={(e) => {
          const arquivos = Array.from(e.clipboardData.files);
          if (arquivos.length) adicionarArquivos(arquivos);
        }}
        tabIndex={0}
        role="button"
        aria-label="Selecionar, arrastar ou colar imagens"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
          arrastando ? "border-primary bg-muted" : "border-border hover:bg-muted/50"
        )}
      >
        <p>Clique, arraste imagens aqui ou cole com Ctrl+V</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) adicionarArquivos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((file, i) => (
            <div key={`${file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removerArquivo(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover imagem"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
