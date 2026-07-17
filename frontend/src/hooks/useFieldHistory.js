import { useCallback, useEffect, useState } from "react";
import {
  getFieldHistory,
  recordFieldValue,
} from "../db/fieldHistory.repository.js";

/**
 * Loads recently-used values for a field (buyerName, address, ...) and
 * exposes a `record` function to call once a value is actually committed.
 * Backs the autocomplete dropdown in EditableAutocompleteField.
 *
 * @param {string} fieldName
 * @returns {{ history: string[], record: (value: string) => void }}
 */
export function useFieldHistory(fieldName) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getFieldHistory(fieldName).then((values) => {
      if (!cancelled) setHistory(values);
    });
    return () => {
      cancelled = true;
    };
  }, [fieldName]);

  const record = useCallback(
    (value) => {
      recordFieldValue(fieldName, value).then(() => {
        getFieldHistory(fieldName).then(setHistory);
      });
    },
    [fieldName],
  );

  return { history, record };
}
