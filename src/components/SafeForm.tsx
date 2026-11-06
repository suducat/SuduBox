import {
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type FormHTMLAttributes,
} from "react";
export function SafeForm({
  onSubmit,
  children,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => unknown;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      {...props}
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        try {
          await onSubmit?.(e);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset
        disabled={busy}
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          minWidth: 0,
          display: "contents",
        }}
      >
        {children}
      </fieldset>
    </form>
  );
}

export function useAsyncGuard() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  return {
    busy,
    run: async (fn: () => Promise<unknown>) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        return await fn();
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
  };
}
