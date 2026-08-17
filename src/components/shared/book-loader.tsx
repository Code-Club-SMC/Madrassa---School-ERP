import { useCallback, useEffect, useRef, useState } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SIZES = {
  sm: { w: 140, h: 90 },
  md: { w: 200, h: 128 },
  lg: { w: 264, h: 168 },
};

const PATTERNS = [
  [82, 58, 91, 40, 66],
  [54, 88, 42, 73, 60],
  [90, 47, 68, 35, 80],
  [40, 76, 55, 92, 48],
  [95, 40, 72, 58, 33],
  [62, 84, 45, 70, 90],
];

function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `rgb(${r}, ${g}, ${b})`;
}

function PageLines({ pattern, tint }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[7%] px-[14%]">
      {pattern.map((wPct, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{ width: `${wPct}%`, height: "6%", minHeight: 2, background: tint }}
        />
      ))}
    </div>
  );
}

export function BookLoader({
  text,
  className,
  pageCount = 6,
  flipDuration = 650,
  pauseDuration = 220,
  size = "md",
  coverFrom = "#123524",
  coverTo = "#0a1f15",
  pageColor = "#fbf8f0",
  accent = "#c9a24b",
}) {
  const { w, h } = SIZES[size] ?? SIZES.md;
  const padY = h * 0.11;
  const spineHalf = w * 0.02;
  const stackWidth = w / 2 - spineHalf;
  const totalSteps = pageCount * 2;

  const [step, setStep] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current) return;

    let cancelled = false;
    const id = setInterval(() => {
      if (!cancelled) setStep((s) => (s + 1) % totalSteps);
    }, flipDuration + pauseDuration);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [flipDuration, pauseDuration, totalSteps]);

  const cursor = step <= pageCount ? step : totalSteps - step;
  const activeIndex = step === 0 ? null : step <= pageCount ? step - 1 : totalSteps - step;

  const pageGradient = `linear-gradient(180deg, ${pageColor}, ${shade(pageColor, -6)})`;
  const lineTint = "rgba(20, 35, 25, 0.28)";

  return (
    <>
      <style>{`
        @keyframes bl-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bl-glow {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .65; transform: scale(1.08); }
        }
        @keyframes bl-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bl-curl {
          0% { opacity: 0; }
          40% { opacity: .6; }
          60% { opacity: .6; }
          100% { opacity: 0; }
        }
        .bl-float { animation: bl-float 3.2s ease-in-out infinite; }
        .bl-glow  { animation: bl-glow 3.2s ease-in-out infinite; }
        .bl-fade  { animation: bl-fade .5s ease-out forwards; }
        .bl-curl  { animation: bl-curl var(--flip-ms, 600ms) ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .bl-float, .bl-glow, .bl-curl { animation: none !important; }
        }
      `}</style>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-5",
          className,
        )}
      >
        <div className="relative bl-float" style={{ width: w, height: h + 20 }}>
          <div
            className="absolute rounded-full blur-2xl bl-glow"
            style={{
              inset: -w * 0.14,
              background: `radial-gradient(circle, ${coverFrom}66, transparent 70%)`,
            }}
          />

          <div
            className="relative"
            style={{ width: w, height: h, perspective: w * 3.6 }}
          >
            {/* boards + spine */}
            <div
              className="absolute inset-0 rounded-[7px]"
              style={{
                background: `linear-gradient(145deg, ${coverFrom}, ${coverTo})`,
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px -12px rgba(0,0,0,.55)",
              }}
            />

            {/* gilt edges */}
            <div
              className="absolute"
              style={{
                left: 0,
                top: padY,
                bottom: padY,
                width: 2,
                zIndex: pageCount + 60,
                background: `repeating-linear-gradient(180deg, ${accent}bb 0 2px, transparent 2px 5px)`,
              }}
            />
            <div
              className="absolute"
              style={{
                right: 0,
                top: padY,
                bottom: padY,
                width: 2,
                zIndex: pageCount + 60,
                background: `repeating-linear-gradient(180deg, ${accent}bb 0 2px, transparent 2px 5px)`,
              }}
            />

            {Array.from({ length: pageCount }).map((_, i) => {
              const flipped = i < cursor;
              const active = activeIndex === i;
              const z = active ? pageCount + 50 : flipped ? i + 1 : pageCount - i;
              const stagger = Math.min(i, 3) * 0.6;
              const front = PATTERNS[i % PATTERNS.length];
              const back = PATTERNS[(i + 3) % PATTERNS.length];

              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: padY + stagger,
                    bottom: padY - stagger,
                    width: stackWidth,
                    transformStyle: "preserve-3d",
                    transformOrigin: "left center",
                    transform: `rotateY(${flipped ? -180 : 0}deg)`,
                    transition: `transform ${flipDuration}ms cubic-bezier(.62,.04,.36,1)`,
                    zIndex: z,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-r-[3px]"
                    style={{
                      backfaceVisibility: "hidden",
                      background: pageGradient,
                      boxShadow: "inset -10px 0 14px -10px rgba(0,0,0,.45)",
                    }}
                  >
                    <PageLines pattern={front} tint={lineTint} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-l-[3px]"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: pageGradient,
                      boxShadow: "inset 10px 0 14px -10px rgba(0,0,0,.45)",
                    }}
                  >
                    <PageLines pattern={back} tint={lineTint} />
                  </div>
                  {active && (
                    <div
                      className="absolute inset-0 pointer-events-none bl-curl"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(0,0,0,.45), transparent 72%)",
                        ["--flip-ms"]: `${flipDuration}ms`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="absolute rounded-full blur-md"
            style={{
              left: w * 0.08,
              right: w * 0.08,
              bottom: 0,
              height: 12,
              background: "rgba(0,0,0,.28)",
            }}
          />
        </div>

        {text && (
          <p className="text-xs tracking-wide text-neutral-400 bl-fade font-medium">
            {text}
          </p>
        )}
      </div>
    </>
  );
}
