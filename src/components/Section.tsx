import { ReactNode } from 'react';

interface Props {
  step?: number;
  title: string;
  hint?: string;
  suffix?: ReactNode; // e.g. a small status string shown next to the title
  children: ReactNode;
}

// Wraps a group of related controls with a numbered heading and a divider from the
// section above it — turns a flat wall of inputs into a scannable top-to-bottom flow.
export function Section({ step, title, hint, suffix, children }: Props) {
  return (
    <div className="flex flex-col gap-3.5 pt-4 first:pt-0 border-t border-white/[0.06] first:border-t-0">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-paper/50">
          {step != null && (
            <span className="flex-none w-5 h-5 rounded-full bg-mint/15 text-mint text-[11px] font-bold flex items-center justify-center normal-case tracking-normal">
              {step}
            </span>
          )}
          {title}
          {suffix && <span className="normal-case tracking-normal font-normal text-paper/35">{suffix}</span>}
        </h2>
        {hint && <p className="text-[11px] text-paper/35 mt-1">{hint}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
