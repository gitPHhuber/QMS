import React from "react";
import { Paperclip, Camera } from "lucide-react";

interface FileDropzoneProps {
  label?: string;
  maxSizeMb?: number;
  icon?: "clip" | "camera";
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  label = "Перетащите файлы или нажмите для загрузки",
  icon = "clip",
}) => {
  const Icon = icon === "camera" ? Camera : Paperclip;

  return (
    <div className="border-2 border-dashed border-asvo-border rounded-xl p-5 text-center cursor-pointer hover:border-asvo-accent/50 transition">
      <Icon size={24} className="mx-auto mb-2 text-asvo-text-dim" />
      <p className="text-xs text-asvo-text-dim">{label}</p>
    </div>
  );
};

export default FileDropzone;
