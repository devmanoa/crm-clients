import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';

interface FloatingTooltipProps {
  content: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function FloatingTooltip({ content, children, maxWidth = 360 }: FloatingTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const refEl = useRef<HTMLSpanElement>(null);
  const tooltipEl = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    if (!refEl.current || !tooltipEl.current) return;
    computePosition(refEl.current, tooltipEl.current, {
      placement: 'top-start',
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => setCoords({ x, y }));
  }, []);

  useEffect(() => {
    if (open) update();
  }, [open, update]);

  return (
    <>
      <span
        ref={refEl}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-default"
      >
        {children}
      </span>
      {open && createPortal(
        <div
          ref={tooltipEl}
          style={{ position: 'fixed', left: coords.x, top: coords.y, maxWidth, zIndex: 9999 }}
          className="rounded-lg bg-slate-900 px-3 py-2 text-[12px] font-normal leading-relaxed text-white shadow-lg pointer-events-none"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
