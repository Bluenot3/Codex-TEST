"use client";

import { useCallback, useState } from "react";

interface FileDropProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  children?: React.ReactNode;
}

export const FileDrop = ({ onFiles, accept = "*", children }: FileDropProps) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        accept === "*" ? true : file.type.includes(accept) || accept.includes(file.name.split(".").pop() ?? "")
      );
      if (files.length) {
        onFiles(files);
      }
    },
    [accept, onFiles]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center text-sm transition ${
        dragging ? "border-sky-400/70 bg-sky-500/10 text-white" : "border-white/15 bg-white/5 text-white/70"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept={accept} className="absolute inset-0 cursor-pointer opacity-0" onChange={handleChange} multiple />
      {children ?? <p>Drop files or click to upload.</p>}
    </div>
  );
};
