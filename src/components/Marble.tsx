/**
 * A rain-soaked black marble field, built entirely from layered CSS
 * gradients (conic veining + radial sheen + linear vignette). No image
 * request, scales losslessly, and never shows a decode flash.
 */
export function Marble({ className = '', opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 20% 0%, rgba(207,201,188,0.08), transparent 55%), radial-gradient(90% 70% at 85% 100%, rgba(43,21,48,0.35), transparent 60%), linear-gradient(180deg, #060605 0%, #0b0a09 45%, #050504 100%)',
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: 0.5,
          backgroundImage:
            'conic-gradient(from 210deg at 30% 40%, transparent 0deg, rgba(255,255,255,0.05) 40deg, transparent 90deg, rgba(255,255,255,0.03) 160deg, transparent 220deg), conic-gradient(from 60deg at 75% 65%, transparent 0deg, rgba(255,255,255,0.04) 30deg, transparent 100deg)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.4,
          backgroundImage:
            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.035) 21%, transparent 23%, transparent 48%, rgba(255,255,255,0.025) 49%, transparent 51%, transparent 74%, rgba(255,255,255,0.03) 75%, transparent 77%)',
        }}
      />
    </div>
  );
}
