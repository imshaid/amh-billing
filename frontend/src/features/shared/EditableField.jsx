import { useEffect, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback.js";
import styles from "./EditableField.module.css";

/**
 * Inline-editable text (buyerName, address, date, serialOrLogCode, quantity,
 * rate, etc). Renders as plain text-like input matching the surrounding
 * document typography — no visible "field" chrome until hover/focus (dashed
 * underline), so the printed-document look (see BillPage/InvoicePage) isn't
 * broken by an editor affordance.
 *
 * Auto-save is debounced: `onChange` (typically wired to `updateDraftPage`)
 * fires 500ms after the user stops typing, not per keystroke — see
 * useDebouncedCallback. Local `value` state updates immediately so typing
 * never feels laggy; only the IndexedDB write is delayed.
 *
 * @param {{
 *   value: string|number|null,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   type?: "text"|"number"|"date",
 *   className?: string,
 *   style?: object,
 * }} props
 */
export default function EditableField({
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
  style,
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const debouncedSave = useDebouncedCallback(onChange, 500);

  // Keep local state in sync if the page changes underneath us (e.g.
  // switching which page is active, or a summary re-aggregation).
  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  function handleChange(e) {
    setLocalValue(e.target.value);
    debouncedSave(e.target.value);
  }

  return (
    <input
      type={type}
      className={`${styles.field} ${className}`}
      style={style}
      value={localValue}
      placeholder={placeholder}
      onChange={handleChange}
      size={Math.max(String(localValue || placeholder).length, 3)}
    />
  );
}
