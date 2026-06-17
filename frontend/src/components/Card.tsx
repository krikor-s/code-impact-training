import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-xl px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
