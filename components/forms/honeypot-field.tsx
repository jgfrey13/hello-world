import * as React from "react";

/**
 * Spam-trap field, visually hidden and excluded from the accessibility tree.
 * Humans never fill it; submissions containing it are rejected server-side
 * (see lib/security/rate-limit.ts). The id is unique per instance (the
 * footer newsletter form coexists with page forms); the NAME stays stable
 * because the server check keys on it.
 */
export function HoneypotField() {
  const id = React.useId();
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
    >
      <label htmlFor={id}>Leave this field empty</label>
      <input
        id={id}
        name="website2"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
