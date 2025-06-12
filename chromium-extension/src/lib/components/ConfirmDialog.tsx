import { VariantProps } from "class-variance-authority";
import { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/shadcn/alert-dialog";
import { buttonVariants } from "~/lib/ui/shadcn/button";

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant,
}: {
  trigger: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>{trigger}</AlertDialogTrigger>
      {/* Force small width for Chrome Extension UI */}
      <AlertDialogContent className="!max-w-xs">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant}>{confirmLabel ?? "Confirm"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
