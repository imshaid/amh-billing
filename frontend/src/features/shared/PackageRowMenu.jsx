import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PackageRowMenu.module.css";

/**
 * Clicking a line item's package name opens a small Edit/Delete menu —
 * "Edit" opens the package picker to replace this row's package entirely
 * (for "picked the wrong package"); "Delete" removes the row (after
 * confirmation, handled by the caller). This is the only way to edit or
 * delete an existing package row — adding a new one is the separate "+"
 * button (see LineItemActions), always visible to the left of every row.
 *
 * Portaled to `document.body` and positioned via the trigger's
 * getBoundingClientRect() — same reasoning as DateField/EditableField's
 * dropdowns: this sits inside a table cell that could be inside other
 * constrained containers, so a normally-positioned absolute dropdown risks
 * being clipped rather than just failing to render.
 *
 * @param {{ packageName: string, onEdit: () => void, onDelete: () => void }} props
 */
export default function PackageRowMenu({ packageName, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      const clickedTrigger = triggerRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedMenu) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 2, left: rect.left });
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        onClick={openMenu}
      >
        {packageName}
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
            >
              এডিট
            </button>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemDelete}`}
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
            >
              ডিলিট
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
