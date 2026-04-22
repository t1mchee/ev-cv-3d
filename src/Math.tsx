import React, { useEffect, useRef } from 'react';

// Global MathJax is loaded from index.html. We ask it to typeset the element
// after every render so \(...\) TeX inside children becomes SVG math.
interface MathJaxGlobal {
  typesetPromise?: (els: Element[]) => Promise<void>;
  startup?: { promise?: Promise<void> };
}

declare global {
  interface Window { MathJax?: MathJaxGlobal; }
}

export function MathSpan({
  children,
  as: Tag = 'span',
  style,
}: {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mj = window.MathJax;
    if (!mj || !ref.current) return;
    const el = ref.current;
    const go = () => mj.typesetPromise?.([el])?.catch(() => { /* ignore */ });
    if (mj.startup?.promise) {
      mj.startup.promise.then(go);
    } else {
      go();
    }
  }, [children]);

  return React.createElement(Tag, { ref, style }, children);
}

// Convenience for inline TeX: <Tex>{'x_1'}</Tex> emits \(x_1\) inside a span
// and asks MathJax to typeset it.
export function Tex({ children }: { children: string }) {
  return <MathSpan>{`\\(${children}\\)`}</MathSpan>;
}
