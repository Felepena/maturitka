"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

type Props = {
  className?: string;
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
};

export function FileUpload({
  className,
  label = "File Upload",
  description = "Drag and drop or browse",
  accept = "image/*",
  maxSizeMB = 10,
  multiple = false,
  onFiles,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function validate(files: FileList) {
    setError(null);
    if (!files || files.length === 0) return false;
    const max = maxSizeMB * 1024 * 1024;
    for (const f of Array.from(files)) {
      if (f.size > max) {
        setError(`File exceeds ${maxSizeMB}MB`);
        return false;
      }
      if (accept && !Array.from(accept.split(",")).some((pat) => matchAccept(f, pat.trim()))) {
        setError("Unsupported file type");
        return false;
      }
    }
    return true;
  }

  function matchAccept(file: File, pattern: string) {
    if (!pattern) return true;
    if (pattern === "*") return true;
    if (pattern.endsWith("/*")) {
      const type = pattern.slice(0, -2);
      return file.type.startsWith(type + "/");
    }
    return file.type === pattern || (pattern.startsWith(".") && file.name.endsWith(pattern));
  }

  function handleFiles(files: FileList) {
    if (validate(files)) onFiles(files);
  }

  return (
    <Card className={cn("bg-white text-neutral-900", className)}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors",
            dragActive ? "border-neutral-400 bg-neutral-100" : "border-neutral-300 bg-neutral-50"
          )}
        >
          <div className="mb-3 grid size-10 place-items-center rounded-full bg-neutral-200">
            <Upload className="size-5 text-neutral-700" />
          </div>
          <div className="text-sm font-medium">Upload files</div>
          <div className="mt-1 text-xs text-neutral-600">
            {accept || "Any"} up to {maxSizeMB}MB
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            className="mt-4 rounded-full"
            onClick={() => inputRef.current?.click()}
          >
            Browse Files
          </Button>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
