/**
 * A small component to add a red asterisk for required fields
 */
export function RequiredFieldIndicator() {
  return (
    <span className="text-red-500 ml-1" aria-hidden="true">
      *
    </span>
  );
}