export function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="text-sm font-medium text-status-error-ink">
      {message}
    </span>
  ) : null;
}
