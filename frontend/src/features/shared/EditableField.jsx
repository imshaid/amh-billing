import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * Always fills its container (`width: 100%` on both the wrapper span and
 * the input itself) rather than sizing to browser-default input width —
 * this used to be conditional on a `fill` prop, with quantity/rate table
 * cells passing `fill={false}` to "stay compact." That was actually the
 * bug: without an explicit width, a plain `<input>` defaults to roughly a
 * 20-character-wide browser default, which is *wider* than a narrow
 * Quantity/Rate `<td>` under `table-layout: fixed` (see BillPage.module.css
 * — those columns are only ~8-9% of the page width). The oversized input
 * visually overflowed into the neighboring column, which is what was
 * reported as "clicking Quantity opens the field over Rate" and "Rate
 * values appear under Amount." Filling the actual (narrow) `<td>` at 100%
 * is what makes it compact — there's no separate non-fill mode needed.
 *
 * `align="center"` is still meaningful independent of width — quantity/rate
 * values are centered within their (now correctly narrow) cell.
 *
 * `autocompleteField`, when given a field name (e.g. "buyerName"), turns on
 * a live-filtered suggestion dropdown backed by useFieldHistory — recently
 * used values across every past session, not just this one, since the same
 * buyer/address recurs across sessions (see project notes on repeat
 * villages/schools). A value is recorded into that history once the
 * debounced save actually commits, not on every keystroke.
 *
 * The dropdown is rendered through a React portal into `document.body` —
 * same reason as DateField's calendar popup: this field lives inside
 * DocumentHeader's `.valueLine`, which has `overflow: hidden` for the
 * dotted-underline background trick, so a normally-positioned dropdown
 * would be silently clipped to invisibility instead of actually failing to
 * open. See DateField.jsx's doc comment for the full explanation — this
 * was the same underlying bug reported as "date picker not working",
 * affecting every autocomplete-enabled field the same way.
 *
 * `formatDisplay(value)`, when given, only changes what's SHOWN while the
 * field is not focused (e.g. "40" → "40.00" for rate/amount-style number
 * fields matching this document's ৳X.XX convention) — the moment the user
 * focuses/clicks in, the input reverts to the raw editable value
 * (`localValue`, unformatted), so typing "40.5" never fights against a
 * forced ".00" being reapplied mid-keystroke. Purely cosmetic and
 * type="number"-only in practice; omit it for text fields (buyerName,
 * address, etc), which have no such formatted/raw distinction to begin
 * with.
 *
 * @param {{
 *   value: string|number|null,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   type?: "text"|"number",
 *   align?: "left"|"center",
 *   autocompleteField?: string,
 *   className?: string,
 *   formatDisplay?: (value: string|number) => string,
 * }} props
 */
export default function EditableField({
  value,
  onChange,
  placeholder = "",
  type = "text",
  align = "left",
  autocompleteField,
  className = "",
  formatDisplay,
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const debouncedSave = useDebouncedCallback((v) => {
    onChange(v);
    if (autocompleteField) record(v);
  }, 500);
  const { history, record } = useFieldHistory(
    autocompleteField ?? "__unused__",
  );
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Keep local state in sync if the page changes underneath us (e.g. a
  // summary re-aggregation, or switching which page this field belongs to).
  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  // Close the suggestion dropdown on outside click. Checks both the input
  // wrapper AND the portaled dropdown itself (dropdownRef), since the
  // dropdown is no longer a DOM descendant of wrapperRef once portaled.
  useEffect(() => {
    if (!isFocused) return;
    function handleClickOutside(e) {
      const clickedWrapper = wrapperRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);
      if (!clickedWrapper && !clickedDropdown) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused]);

  // Keep the portaled dropdown pinned under the input while open (e.g. if
  // the workspace canvas scrolls — see CanvasArea).
  useEffect(() => {
    if (!isFocused) return;
    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width,
        });
      }
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isFocused]);

  function handleChange(e) {
    setLocalValue(e.target.value);
    debouncedSave(e.target.value);
  }

  function handleFocus() {
    setIsFocused(true);
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
      });
    }
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

  // See this component's own doc comment on `formatDisplay` — only applies
  // while not focused, and only when there's an actual non-empty value to
  // format (an empty field should stay empty/show its placeholder, not
  // become "0.00" out of nowhere).
  const displayValue =
    !isFocused && formatDisplay && localValue !== ""
      ? formatDisplay(localValue)
      : localValue;

  return (
    <span className={styles.wrapper} ref={wrapperRef}>
      <input
        ref={inputRef}
        type={type}
        className={`${styles.field} ${className}`}
        data-align={align}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {showDropdown &&
        dropdownPosition &&
        createPortal(
          <span
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
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
          </span>,
          document.body,
        )}
    </span>
  );
}
