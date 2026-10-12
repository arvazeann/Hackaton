export function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="text-sm font-medium text-rose-700">
      {message}
    </span>
  ) : null;
}
