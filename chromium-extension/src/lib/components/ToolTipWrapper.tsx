import { TooltipContentProps, TooltipProps } from "@radix-ui/react-tooltip";
import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/components/shadcn/tooltip";

export default function ToolTipWrapper({
  backgroundColorHex,
  children,
  content,
  delayDuration,
  open,
  side,
}: {
  backgroundColorHex?: string;
  children: ReactNode;
  content: ReactNode;
} & TooltipProps &
  TooltipContentProps) {
  return (
    <Tooltip delayDuration={delayDuration} open={open}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent backgroundColorHex={backgroundColorHex} side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
