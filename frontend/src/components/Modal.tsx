import type { ReactNode } from "react";
import Button from "./Button";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="glass-strong relative rounded-2xl px-6 py-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button variant="secondary" onClick={onClose} className="px-2 py-1 text-xs">
            ✕
          </Button>
        </div>
        <div className="text-white/80 text-sm">{children}</div>
      </div>
    </div>
  );
}
