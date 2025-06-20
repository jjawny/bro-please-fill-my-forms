import { TooltipContentProps, TooltipProps } from "@radix-ui/react-tooltip";
import { ReactNode, forwardRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/components/shadcn/tooltip";

const ToolTipWrapper = forwardRef<
  HTMLDivElement,
  {
    backgroundColorHex?: string;
    children: ReactNode;
    content: ReactNode;
  } & TooltipProps &
    TooltipContentProps
>(({ backgroundColorHex, children, content, delayDuration, open, side, ...props }, ref) => {
  return (
    <Tooltip delayDuration={delayDuration} open={open}>
      <TooltipTrigger asChild>
        <div ref={ref} {...props}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent backgroundColorHex={backgroundColorHex} side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
});

export default ToolTipWrapper;
