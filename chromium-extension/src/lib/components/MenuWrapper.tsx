import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/lib/components/shadcn/dropdown-menu";

export type MenuItem = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function MenuWrapper({
  trigger,
  side,
  align = "start",
  menuLabel,
  items,
}: { trigger: ReactNode; menuLabel: string; items: MenuItem[] } & DropdownMenuContentProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={align} side={side}>
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuGroup>
          {items.map((item, index) => (
            <DropdownMenuItem key={index} onClick={item.onClick} disabled={item.disabled}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
