import { useStore } from "./context";
import { useEffect, useRef, type ReactNode } from "react";
import { Plus, ArrowUpRight, Inbox, X } from "lucide-react";
export function Empty({
  title = "这里还空着",
  description = "从第一条记录开始，让学习井井有条。",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={25} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow || "YOUR STUDY SPACE"}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button className="primary" onClick={onClick}>
      <Plus size={17} />
      {children}
    </button>
  );
}
export function Panel({
  title,
  children,
  link,
}: {
  title: string;
  children: ReactNode;
  link?: string;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {link && (
          <a href={`#/${link}`} className="subtle-link">
            查看全部 <ArrowUpRight size={15} />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const { message, toast } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    toast("");
    d.showModal();
    return () => {
      d.close();
      const blockDouble = (e: MouseEvent) => {
        if (e.detail > 1) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      };
      document.addEventListener("click", blockDouble, true);
      setTimeout(
        () => document.removeEventListener("click", blockDouble, true),
        400,
      );
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="关闭" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {message && (
        <p role="status" className="modal-feedback">
          {message}
        </p>
      )}
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  close,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  close: () => void;
}) {
  return (
    <Modal title={title} close={close}>
      <p>{description}</p>
      <div className="form-actions">
        <button onClick={close}>取消</button>
        <button className="danger" onClick={onConfirm}>
          确认{title}
        </button>
      </div>
    </Modal>
  );
}
export const colors = [
  "#4979e8",
  "#8c6bd4",
  "#d38b42",
  "#3f9e8f",
  "#d46f91",
  "#6c87a3",
];
export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="colors">
      {colors.map((c) => (
        <button
          type="button"
          key={c}
          aria-label={`颜色 ${c}`}
          aria-pressed={value === c}
          style={{ background: c }}
          className={value === c ? "selected" : ""}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}
