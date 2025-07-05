import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/lib/components/shadcn/dialog";

export default function DialogWrapper({
  isOpen,
  onClose,
  Title,
  Content,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  Title?: ReactNode;
  Content?: ReactNode;
}) {
  const handleOpenChange = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{Title ?? "Title goes here"}</DialogTitle>
          <DialogDescription>{Content ?? "Content goes here"}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
