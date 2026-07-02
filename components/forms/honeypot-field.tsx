/**
 * Spam-trap field, visually hidden and excluded from the accessibility tree.
 * Humans never fill it; submissions containing it are rejected server-side
 * (see lib/security/rate-limit.ts).
 */
export function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
    >
      <label htmlFor="website2">Leave this field empty</label>
      <input
        id="website2"
        name="website2"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
