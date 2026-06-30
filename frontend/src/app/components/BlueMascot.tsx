import OriginalBlue from "../../imports/OriginalBlue/OriginalBlue";
import BlueCharacter from "../../imports/BlueCharacter/BlueCharacter";

export function BlueMascot({
  size = 80,
  variant = "original",
  className = "",
  label = false,
}: {
  size?: number;
  variant?: "original" | "character";
  className?: string;
  label?: boolean;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="Blue mascot"
    >
      <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(62,193,211,0.35), rgba(62,193,211,0) 70%)" }} />
      <div className="relative" style={{ width: size, height: size }}>
        {variant === "original" ? <OriginalBlue /> : <BlueCharacter />}
      </div>
      {label && (
        <span className="absolute -bottom-5 text-[10px] uppercase tracking-wider text-[color:var(--color-deep-water)]/60">
          Blue mascot asset placeholder
        </span>
      )}
    </div>
  );
}
