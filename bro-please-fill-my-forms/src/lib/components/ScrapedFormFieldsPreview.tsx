import { useMemo, useState } from "react";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";
import DialogWrapper from "./DialogWrapper";
import ScrapedFormFieldBadge, { FieldDetailBadge, OverflowBadge } from "./ScrapedFormFieldBadge";

// Test/adjust these values together
const UI_ITEM_WIDTH_PX = 90;
const UI_OVERFLOW_ITEM_WIDTH_PX = 40;
const GAP_WIDTH_PX = 4;

/**
 * Hints at the scraped inputs for transparency/better feedback
 */
export default function ScrapedFormFieldsPreview({
  scrapedForm,
  className,
}: {
  scrapedForm: ScrapedForm;
  className?: string;
}) {
  const [isFieldsDialogOpen, setIsFieldsDialogOpen] = useState<boolean>(false);

  const { containerRef, visibleItemCount, invisibleItemCount } = useUiItemWidthCalculator({
    totalItems: scrapedForm.fields.length,
    uiItemWidthPx: UI_ITEM_WIDTH_PX,
    gapWidthPx: GAP_WIDTH_PX,
    uiOverflowItemWidthPx: UI_OVERFLOW_ITEM_WIDTH_PX,
  });

  const visibleFields = useMemo(() => {
    return scrapedForm.fields.slice(0, visibleItemCount);
  }, [scrapedForm.fields, visibleItemCount]);

  const openDialog = () => {
    setIsFieldsDialogOpen(true);
  };

  return (
    <div ref={containerRef} className={className}>
      <DialogWrapper
        isOpen={isFieldsDialogOpen}
        onClose={() => setIsFieldsDialogOpen(false)}
        Title={`Found ${scrapedForm.fields.length} Fields`}
        Content={<ScrapedFormFieldsSummary scrapedForm={scrapedForm} />}
      />
      <div
        className={cn(
          "flex gap-1 items-center",
          "font-mono", // use monospace font for equal-width chars
        )}
        style={{ gap: `${GAP_WIDTH_PX}px` }}
      >
        {visibleFields.map((field) => (
          <ScrapedFormFieldBadge key={field.id} field={field} widthPx={UI_ITEM_WIDTH_PX} onClick={openDialog} />
        ))}
        {invisibleItemCount > 0 && (
          <OverflowBadge count={invisibleItemCount} widthPx={UI_OVERFLOW_ITEM_WIDTH_PX} onClick={openDialog} />
        )}
      </div>
    </div>
  );
}

function ScrapedFormFieldsSummary({ scrapedForm }: { scrapedForm: ScrapedForm }) {
  const SoftBorder = ({ className }: { className?: string }) => {
    return (
      <span
        className={cn(className, "absolute left-0 right-0 h-4 from-background to-transparent pointer-events-none")}
      />
    );
  };
  return (
    <span className="relative block">
      <span className="flex flex-col gap-1 py-2.5 max-h-[calc(100vh-200px)] overflow-y-scroll">
        {scrapedForm.fields.map((field) => (
          <FieldDetailBadge key={field.id} field={field} />
        ))}
      </span>
      <SoftBorder className="bg-gradient-to-b top-0" />
      <SoftBorder className="bg-gradient-to-t bottom-0" />
    </span>
  );
}
