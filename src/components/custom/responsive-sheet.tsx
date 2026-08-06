import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ResponsiveSheetProps = {
  title: string;
  description: string;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  icon?: LucideIcon;
  isDirty?: boolean;
  confirmCloseTitle?: string;
  confirmCloseDescription?: string;
};

export function ResponsiveSheet({
  description,
  title,
  children,
  open,
  onOpenChange,
  className,
  icon,
  isDirty,
  confirmCloseTitle,
  confirmCloseDescription,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();
  const Icon = icon;
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmingRef = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      if (confirmingRef.current) return;
      confirmingRef.current = true;
      setShowConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleConfirmResult = (shouldClose: boolean) => {
    setShowConfirm(false);

    if (shouldClose) {
      onOpenChange(false);
      confirmingRef.current = false;
      return;
    }

    window.setTimeout(() => {
      confirmingRef.current = false;
    }, 100);
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2 text-primary font-semibold">
                {Icon && <Icon className="size-6 text-primary" />}
                {title}
              </DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">{children}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent className={cn("min-w-[600px] overflow-y-auto pb-5", className)}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-primary font-semibold text-lg">
                {Icon && <Icon className="size-6 text-primary" />}
                {title}
              </SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="px-5">{children}</div>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCloseTitle ?? "Discard unsaved changes?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCloseDescription ??
                "You have unsaved changes. Closing will discard them permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmResult(false)}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmResult(true)}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
