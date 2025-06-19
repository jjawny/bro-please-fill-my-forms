import { Badge } from "~/lib/components/shadcn/badge";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";
import { truncate } from "~/lib/utils/string-utils";

/**
 * Hints at the scraped inputs for transparency/better feedback
 */
export default function FormFieldBadgeRow({
  scrapedForm,
  className,
}: {
  scrapedForm: ScrapedForm;
  className?: string;
}) {
  // TODO:DOC
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
    <div ref={containerRef} className={className}>
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
