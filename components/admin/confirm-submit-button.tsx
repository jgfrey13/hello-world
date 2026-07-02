"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Submit button that asks for confirmation before submitting its enclosing
 * form. Used for publish/archive/reject/delete and other consequential
 * admin actions.
 */
export function ConfirmSubmitButton({
  confirmTitle,
  confirmDescription,
  children,
  ...buttonProps
}: ButtonProps & {
  confirmTitle: string;
  confirmDescription: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" ref={ref} {...buttonProps}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
        <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => ref.current?.form?.requestSubmit()}>
            Confirm
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
