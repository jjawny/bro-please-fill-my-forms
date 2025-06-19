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
          <Badge
            key={field.id}
            variant="secondary"
            onClick={openDialog}
            className="text-xs cursor-pointer"
            style={{ width: `${UI_ITEM_WIDTH_PX}px` }}
          >
            <TextCursorIcon className="opacity-50" />
            <span className="opacity-75 truncate inline-block">{field.name ?? field.id}</span>
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
    <span className="flex flex-col gap-1 max-h-[calc(100vh-200px)] overflow-y-scroll">
      {scrapedForm.fields.map((field) => (
        <Badge key={field.id} variant="secondary" className="text-xs">
          <TextCursorIcon className="opacity-50" /> {field.name ?? field.label ?? field.id}
          <span className="opacity-75 truncate inline-block">{field.type}</span>
          <span className="opacity-60 truncate inline-block">{field.label ?? field.placeholder}</span>
        </Badge>
      ))}
    </span>
  );
}
