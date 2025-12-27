import React, { useRef, useEffect } from "react";
 
interface DraggableDialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
}

const DraggableDialog: React.FC<DraggableDialogProps> = ({ open, onClose, title = "Dialog", children, }) => {

    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);

  // Open/close by props
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

  // Center initially when opened
    useEffect(() => {
        if (open && dialogRef.current) {
            const dialog = dialogRef.current;
            const rect = dialog.getBoundingClientRect();
            dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
            dialog.style.top = `${(window.innerHeight - rect.height) / 2}px`;
        }
    }, [open]);

  // Drag logic
    useEffect(() => {
      const dialog = dialogRef.current;
      const header = headerRef.current;
      if (!dialog || !header) return;

      let isDragging = false;
      let startX = 0, startY = 0, startLeft = 0, startTop = 0;

      const onMouseDown = (e: MouseEvent) => {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;

          const rect = dialog.getBoundingClientRect();
          startLeft = rect.left;
          startTop = rect.top;

          e.preventDefault();
      };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        dialog.style.left = `${startLeft + dx}px`;
        dialog.style.top = `${startTop + dy}px`;
    };

    const onMouseUp = () => (isDragging = false);

    header.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

      return () => {
          header.removeEventListener("mousedown", onMouseDown);
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
      };
  }, [open]);

  return (
    <dialog ref={dialogRef} style={{ border: "none", borderRadius: "8px", padding: 0, position: "fixed", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", }} >
        <div ref={headerRef} style={{ cursor: "move", userSelect: "none", background: "#1976d2", color: "white", padding: "10px 14px", borderRadius: "8px 8px 0 0",
            display: "flex", alignItems: "center", justifyContent: "space-between", }} >
            <span>{title}</span>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "18px", }} > &times; </button>
        </div>

        <div style={{ padding: "16px", background: "white" }}>{children}</div>
    </dialog>
  );
};

export default DraggableDialog;
