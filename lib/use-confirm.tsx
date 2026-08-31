"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (ok: boolean) => void;
};

export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    }) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback((ok: boolean) => {
    setRequest((current) => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  const dialog = (
    <ConfirmDialog
      open={request != null}
      title={request?.title ?? ""}
      message={request?.message ?? ""}
      confirmLabel={request?.confirmLabel}
      cancelLabel={request?.cancelLabel}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return [confirm, dialog] as const;
}
