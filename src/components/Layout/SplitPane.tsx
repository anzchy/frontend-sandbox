import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import './layout.css';

interface SplitPaneProps {
  children: [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
  direction?: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSize?: number;
}

export function SplitPane({
  children,
  direction = 'horizontal',
  initialSizes,
  minSize = 100,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<number[]>(
    initialSizes ?? children.map(() => 100 / children.length)
  );
  const [dragging, setDragging] = useState<number | null>(null);

  const handleMouseDown = useCallback((index: number) => {
    setDragging(index);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging === null || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const totalSize = direction === 'horizontal' ? rect.width : rect.height;
      const position = direction === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;

      // Calculate new sizes
      const newSizes = [...sizes];
      const percentPosition = (position / totalSize) * 100;

      // Sum of sizes before the dragging divider
      let sumBefore = 0;
      for (let i = 0; i < dragging; i++) {
        sumBefore += newSizes[i] ?? 0;
      }

      // New size for the pane before the divider
      const newSize = percentPosition - sumBefore;
      const minSizePercent = (minSize / totalSize) * 100;

      // Ensure minimum sizes
      if (newSize < minSizePercent) return;

      const nextPane = newSizes[dragging + 1];
      if (nextPane === undefined) return;

      const nextNewSize = nextPane + ((newSizes[dragging] ?? 0) - newSize);
      if (nextNewSize < minSizePercent) return;

      newSizes[dragging] = newSize;
      newSizes[dragging + 1] = nextNewSize;

      setSizes(newSizes);
    },
    [dragging, sizes, direction, minSize]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, handleMouseMove, handleMouseUp, direction]);

  return (
    <div
      ref={containerRef}
      className={`split-pane split-pane--${direction}`}
    >
      {children.map((child, index) => (
        <div key={index} className="split-pane__wrapper">
          <div
            className="split-pane__pane"
            style={{
              [direction === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`,
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`split-pane__divider split-pane__divider--${direction}`}
              onMouseDown={() => handleMouseDown(index)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
