import { TextCursorIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/lib/components/shadcn/badge";
import { useUiItemWidthCalculator } from "~/lib/hooks/useUiItemWidthCalculator";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";
import DialogWrapper from "./DialogWrapper";

// TODO:DOC
// set the font (mono for fixed-width chars) and font size
// These need to be tested and adjusted together
// e.g., set your desired truncate length
// adjust the item width and gap to the desired design
const TRUNCATE_TEXT_LENGTH = 10;
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
        Title="Form Fields Found"
        Content={<FormFieldsSummary scrapedForm={scrapedForm} />}
      />
      <div className="flex font-mono gap-1 items-center" style={{ gap: `${GAP_WIDTH_PX}px` }}>
        {visibleFields.map((field) => (
          <Badge
            key={field.id}
            variant="secondary"
            onClick={openDialog}
            className={cn("text-xs cursor-pointer", "truncate inline-block")}
            style={{ width: `${UI_ITEM_WIDTH_PX}px` }}
          >
            {field.name ?? field.id}
          </Badge>
        ))}
        {invisibleItemCount > 0 && (
          <Badge
            variant="outline"
            onClick={openDialog}
            className={cn("text-xs cursor-pointer px-1.5 overflow-visible")}
            style={{ width: `${UI_OVERFLOW_ITEM_WIDTH_PX}px` }}
          >
            {invisibleItemCount}+
          </Badge>
        )}
      </div>
    </div>
  );
}

function FormFieldsSummary({ scrapedForm }: { scrapedForm: ScrapedForm }) {
  return (
    <span className="flex flex-col gap-1">
      {scrapedForm.fields.map((field) => (
        <Badge key={field.id} variant="secondary" className={cn("text-xs", "inline-flex")}>
          <TextCursorIcon /> {field.name ?? field.label ?? field.id}{" "}
          <span className="text-stone-500">{field.type}</span>
          <span className="text-stone-400">{field.label}</span>
        </Badge>
      ))}
    </span>
  );
}
