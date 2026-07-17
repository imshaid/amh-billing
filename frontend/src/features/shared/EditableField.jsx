import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback.js";
import { useFieldHistory } from "../../hooks/useFieldHistory.js";
import styles from "./EditableField.module.css";

/**
 * Inline-editable text (buyerName, address, serialOrLogCode, quantity,
 * rate, etc). Renders as plain text-like input matching the surrounding
 * document typography — no visible "field" chrome until hover/focus (dashed
 * underline), so the printed-document look (see BillPage/InvoicePage) isn't
 * broken by an editor affordance. Date fields use the separate DateField
 * component instead (dd/mm/yyyy display, not this one).
 *
 * Auto-save is debounced: `onChange` (typically wired to `updateDraftPage`)
 * fires 500ms after the user stops typing, not per keystroke — see
 * useDebouncedCallback. Local `value` state updates immediately so typing
 * never feels laggy; only the IndexedDB write is delayed.
 *
 * Full-width by default (`fill`) — fills whatever container it's placed in
 * (the meta-box value line, a table cell) rather than sizing to its current
 * text length, per the "input field too short" fix. Number fields
 * (quantity/rate) pass `align="center"` and `fill={false}` to stay compact
 * and centered within their table cell instead of stretching the whole
 * column.
 *
 * `autocompleteField`, when given a field name (e.g. "buyerName"), turns on
 * a live-filtered suggestion dropdown backed by useFieldHistory — recently
 * used values across every past session, not just this one, since the same
 * buyer/address recurs across sessions (see project notes on repeat
 * villages/schools). A value is recorded into that history once the
 * debounced save actually commits, not on every keystroke.
 *
 * @param {{
 *   value: string|number|null,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   type?: "text"|"number",
 *   align?: "left"|"center",
 *   fill?: boolean,
 *   autocompleteField?: string,
 *   className?: string,
 * }} props
 */
export default function EditableField({
  value,
  onChange,
  placeholder = "",
  type = "text",
  align = "left",
  fill = true,
  autocompleteField,
  className = "",
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSave = useDebouncedCallback((v) => {
    onChange(v);
    if (autocompleteField) record(v);
  }, 500);
  const { history, record } = useFieldHistory(
    autocompleteField ?? "__unused__",
  );
  const wrapperRef = useRef(null);

  // Keep local state in sync if the page changes underneath us (e.g. a
  // summary re-aggregation, or switching which page this field belongs to).
  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  // Close the suggestion dropdown on outside click.
  useEffect(() => {
    if (!isFocused) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused]);

  function handleChange(e) {
    setLocalValue(e.target.value);
    debouncedSave(e.target.value);
  }

  function handlePickSuggestion(suggestion) {
    setLocalValue(suggestion);
    onChange(suggestion);
    record(suggestion);
    setIsFocused(false);
  }

  const filteredSuggestions = autocompleteField
    ? history.filter(
        (v) =>
          v.toLowerCase().includes(String(localValue).toLowerCase()) &&
          v !== localValue,
      )
    : [];

  const showDropdown =
    autocompleteField && isFocused && filteredSuggestions.length > 0;

  return (
    <span
      className={styles.wrapper}
      ref={wrapperRef}
      data-fill={fill || undefined}
    >
      <input
        type={type}
        className={`${styles.field} ${className}`}
        data-align={align}
        data-fill={fill || undefined}
        value={localValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
      />
      {showDropdown && (
        <span className={styles.dropdown}>
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.dropdownItem}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so the click actually registers before blur
                handlePickSuggestion(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
