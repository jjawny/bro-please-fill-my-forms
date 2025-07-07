import { TextCursorIcon } from "lucide-react";
import Badge from "~/lib/components/shadcn/badge";
import { INPUT_TYPE_ICON_MAP } from "~/lib/constants/html-input-type-icon-map";
import { ScrapedForm } from "~/lib/models/FormField";
import { cn } from "~/lib/utils/cn";

const SHARED_BADGE_STYLES = "select-none text-xs cursor-pointer hover:scale-105";

export default function ScrapedFormFieldBadge({
  field,
  widthPx,
  onClick,
}: {
  field: ScrapedForm["fields"][0];
  widthPx: number;
  onClick: () => void;
}) {
  const IconComponent = getIconByType(field.type);
  return (
    <Badge
      key={field.id}
      variant="secondary"
      onClick={onClick}
      className={SHARED_BADGE_STYLES}
      style={{ width: `${widthPx}px` }}
    >
      <IconComponent className="opacity-50" />
      <span className="opacity-75 truncate inline-block">{field.name ?? field.id}</span>
    </Badge>
  );
}

export function OverflowBadge({ count, widthPx, onClick }: { count: number; widthPx: number; onClick: () => void }) {
  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(SHARED_BADGE_STYLES, "px-1.5 overflow-visible")}
      style={{ width: `${widthPx}px` }}
    >
      {count}+
    </Badge>
  );
}

export function FieldDetailBadge({ field }: { field: ScrapedForm["fields"][0] }) {
  const IconComponent = getIconByType(field.type);
  const Bullet = () => <span className="opacity-20">•</span>;

  const label1 = field.name ?? field.label ?? field.id;
  const label2 = field.type;
  const label3 = field.label?.trim() !== "" ? field.label : field.placeholder;

  return (
    <Badge key={field.id} variant="secondary" className={cn("text-xs whitespace-normal", "!select-text")}>
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
}

function getIconByType(htmlInputType?: string) {
  const cleanType = htmlInputType?.toLowerCase();
  const IconComponent = INPUT_TYPE_ICON_MAP[cleanType as keyof typeof INPUT_TYPE_ICON_MAP];
  return IconComponent || TextCursorIcon;
}
