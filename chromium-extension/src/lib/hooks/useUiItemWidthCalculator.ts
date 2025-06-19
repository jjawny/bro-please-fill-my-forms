import { useEffect, useRef, useState } from "react";

/**
 * Calculates how many fixed-width items can fit in a container, re-computes on resize
 */
export function useUiItemWidthCalculator({
  totalItems,
  uiItemWidthPx,
  gapWidth,
  uiOverflowItemWidth: overflowItemWidth,
  containerPaddingY = 16,
}: {
  totalItems: number;
  uiItemWidthPx: number;
  gapWidth: number;
  uiOverflowItemWidth: number;
  containerPaddingY?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItemCount, setVisibleItemCount] = useState<number>(0);
  const [invisibleItemCount, setInvisibleItemCount] = useState<number>(0);

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth - containerPaddingY;
      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < totalItems; i++) {
        const currentGapWidth = i > 0 ? gapWidth : 0;
        const remainingItems = totalItems - i - 1;
        const needsOverflowItem = remainingItems > 0;
        const requiredWidth =
          totalWidth + currentGapWidth + uiItemWidthPx + (needsOverflowItem ? gapWidth + overflowItemWidth : 0);

        if (requiredWidth > containerWidth) {
          break;
        }

        totalWidth += currentGapWidth + uiItemWidthPx;
        count++;
      }

      setVisibleItemCount(count);
      setInvisibleItemCount(totalItems - count);
    };

    calculateVisibleItems();

    const resizeObserver = new ResizeObserver(calculateVisibleItems);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [totalItems, gapWidth, uiItemWidthPx, overflowItemWidth, containerPaddingY]);

  return { containerRef, visibleItemCount, invisibleItemCount };
}
