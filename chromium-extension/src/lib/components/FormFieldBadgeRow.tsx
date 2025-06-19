import { useState } from "react";
import { Badge } from "~/lib/components/shadcn/badge";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";
import { truncate } from "~/lib/utils/string-utils";
import DialogWrapper from "./DialogWrapper";

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
  const [isFieldsDialogOpen, setIsFieldsDialogOpen] = useState<boolean>(false);

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

  const openDialog = () => {
    setIsFieldsDialogOpen(true);
  };

  return (
    <div ref={containerRef} className={className}>
      <DialogWrapper isOpen={isFieldsDialogOpen} onClose={() => setIsFieldsDialogOpen(false)} />
      <div className="flex font-mono gap-1 items-center" style={{ gap: `${gapWidthPx}px` }}>
        {scrapedForm.fields.slice(0, visibleItemCount).map((field) => (
          <Badge
            key={field.id}
            variant="secondary"
            onClick={openDialog}
            className={cn("text-xs cursor-pointer", "truncate inline-block")}
            style={{ width: `${uiItemWidthPx}px` }}
          >
            {truncate(field.name ?? field.label ?? field.id, truncateTextLength)}
          </Badge>
        ))}
        {invisibleItemCount > 0 && (
          <Badge
            variant="outline"
            onClick={openDialog}
            className={cn("text-xs cursor-pointer px-1.5 overflow-visible")}
            style={{ width: `${uiOverflowItemWidth}px` }}
          >
            {invisibleItemCount}+
          </Badge>
        )}
      </div>
    </div>
  );
}
