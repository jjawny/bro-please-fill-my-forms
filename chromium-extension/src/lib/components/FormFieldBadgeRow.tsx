import { useMemo, useState } from "react";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import DialogWrapper from "./DialogWrapper";
import FieldBadge, { FieldDetailBadge, OverflowBadge } from "./FormFieldBadge";

// TODO:DOC
// set the font (mono for fixed-width chars) and font size
// These need to be tested and adjusted together
// e.g., set your desired truncate length
// adjust the item width and gap to the desired design
const UI_ITEM_WIDTH_PX = 90;
const UI_OVERFLOW_ITEM_WIDTH_PX = 40;
const GAP_WIDTH_PX = 4;

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
        Content={<FormFieldsSummary scrapedForm={scrapedForm} />}
      />
      <div className="flex font-mono gap-1 items-center" style={{ gap: `${GAP_WIDTH_PX}px` }}>
        {visibleFields.map((field) => (
          <FieldBadge key={field.id} field={field} widthPx={UI_ITEM_WIDTH_PX} onClick={openDialog} />
        ))}
        {invisibleItemCount > 0 && (
          <OverflowBadge count={invisibleItemCount} widthPx={UI_OVERFLOW_ITEM_WIDTH_PX} onClick={openDialog} />
        )}
      </div>
    </div>
  );
}

function FormFieldsSummary({ scrapedForm }: { scrapedForm: ScrapedForm }) {
  return (
    <span className="relative block">
      <span className="flex flex-col gap-1 py-2.5 max-h-[calc(100vh-200px)] overflow-y-scroll">
        {scrapedForm.fields.map((field) => (
          <FieldDetailBadge key={field.id} field={field} />
        ))}
      </span>
      {/* Soft borders (top, bottom) */}
      <span className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none" />
      <span className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </span>
  );
}
