import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/shadcn/tooltip";

export default function ToolTipWrapper({
  backgroundColorHex,
  children,
  content,
}: {
  backgroundColorHex?: string;
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent backgroundColorHex={backgroundColorHex}>{content}</TooltipContent>
    </Tooltip>
  );
}
