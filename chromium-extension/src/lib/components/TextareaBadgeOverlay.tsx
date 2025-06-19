import { Badge } from "~/lib/components/shadcn/badge";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";
import { truncate } from "~/lib/utils/string-utils";

/**
 * Hints at the scraped inputs for transparency/better feedback
 */
export default function TextareaBadgeOverlay({ scrapedForm }: { scrapedForm: ScrapedForm }) {
  // set the font (mono for fixed-width chars) and font size
  // These need to be tested and adjusted together
  // e.g., set your desired truncate length
  // adjust the item width and gap to the desired design
  const truncateTextLength = 10;
  const uiItemWidthPx = 90;
  const uiOverflowItemWidth = 40;
  const gapWidthPx = 4;

  const totalFields = scrapedForm.fields.length;

  const { containerRef, visibleItemCount, invisibleItemCount } = useUiItemWidthCalculator({
    totalItems: totalFields,
    uiItemWidthPx: uiItemWidthPx,
    gapWidth: gapWidthPx,
    uiOverflowItemWidth: uiOverflowItemWidth,
  });

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 h-fit pt-6 pb-1 rounded-md m-[1px] flex items-center px-2 bg-gradient-to-t from-[var(--pin-background-color)] via-[var(--pin-background-color)] to-transparent justify-end"
    >
      <div className="flex font-mono gap-1 items-center" style={{ gap: `${gapWidthPx}px` }}>
        {scrapedForm.fields.slice(0, visibleItemCount).map((field) => (
          <Badge
            key={field.id}
            variant="secondary"
            className={cn("text-xs", "truncate inline-block")}
            style={{ width: `${uiItemWidthPx}px` }}
          >
            {truncate(field.name ?? field.label ?? field.id, truncateTextLength)}
          </Badge>
        ))}
        {invisibleItemCount > 0 && (
          <Badge
            variant="outline"
            className={cn("text-xs px-1.5 overflow-visible")}
            style={{ width: `${uiOverflowItemWidth}px` }}
          >
            {invisibleItemCount}+
          </Badge>
        )}
      </div>
    </div>
  );
}
