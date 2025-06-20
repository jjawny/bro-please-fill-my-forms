import { TextCursorIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/lib/components/shadcn/badge";
import { INPUT_TYPE_ICON_MAP } from "~/lib/constants/html-input-type-icon-map";
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

const SHARED_BADGE_STYLES = "text-xs cursor-pointer hover:scale-105";
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
        {visibleFields.map((field) => {
          const IconComponent = getIconByType(field.type);
          return (
            <Badge
              key={field.id}
              variant="secondary"
              onClick={openDialog}
              className={SHARED_BADGE_STYLES}
              style={{ width: `${UI_ITEM_WIDTH_PX}px` }}
            >
              <IconComponent className="opacity-50" />
              <span className="opacity-75 truncate inline-block">{field.name ?? field.id}</span>
            </Badge>
          );
        })}
        {invisibleItemCount > 0 && (
          <Badge
            variant="outline"
            onClick={openDialog}
            className={cn(SHARED_BADGE_STYLES, "px-1.5 overflow-visible")}
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
  const Bullet = () => <span className="opacity-20">•</span>;

  return (
    <span className="relative block">
      <span className="flex flex-col gap-1 py-2.5 max-h-[calc(100vh-200px)] overflow-y-scroll">
        {scrapedForm.fields.map((field) => {
          const IconComponent = getIconByType(field.type);

          const label1 = field.name ?? field.label ?? field.id;
          const label2 = field.type;
          const label3 = field.label?.trim() !== "" ? field.label : field.placeholder;

          return (
            <Badge key={field.id} variant="secondary" className="text-xs whitespace-normal">
              <IconComponent className="opacity-50" /> {label1}
              <Bullet />
              <span className="opacity-60">{label2}</span>
              {label3 && (
                <>
                  <Bullet />
                  <span className="opacity-40">{label3}</span>
                </>
              )}
            </Badge>
          );
        })}
      </span>
      {/* Soft borders (top, bottom) */}
      <span className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none" />
      <span className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </span>
  );
}

function getIconByType(htmlInputType?: string) {
  const cleanType = htmlInputType?.toLowerCase();
  const IconComponent = INPUT_TYPE_ICON_MAP[cleanType as keyof typeof INPUT_TYPE_ICON_MAP];
  return IconComponent || TextCursorIcon;
}
