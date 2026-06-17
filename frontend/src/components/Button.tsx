import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const styles: Record<Variant, string> = {
  primary:
    "bg-white/20 text-white border border-white/25 hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)] active:translate-y-0 active:shadow-[0_0_12px_rgba(255,255,255,0.2)]",
  secondary:
    "bg-white/10 text-white/70 border border-white/15 hover:bg-white/15 hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(255,255,255,0.08)] active:translate-y-0",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
}) {
  return (
    <button
      className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
