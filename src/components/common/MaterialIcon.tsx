import { cn } from "@/lib/utils";

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

/**
 * Thin wrapper around the Material Symbols Outlined icon font used
 * throughout the Stitch designs (e.g. `dashboard`, `school`, `mosque`).
 */
export function MaterialIcon({ name, className, filled }: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined select-none", filled && "fill", className)}
    >
      {name}
    </span>
  );
}
