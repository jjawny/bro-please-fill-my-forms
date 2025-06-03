import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./shadcn/tooltip";

export default function ToolTipWrapper({
  backgroundColor,
  children,
  content,
}: {
  backgroundColor?: string;
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent backgroundColor={backgroundColor}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
