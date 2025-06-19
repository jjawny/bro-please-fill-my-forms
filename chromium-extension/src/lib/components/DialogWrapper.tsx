import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/lib/components/shadcn/dialog";

export default function DialogWrapper({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const handleOpenChange = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our
            servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
