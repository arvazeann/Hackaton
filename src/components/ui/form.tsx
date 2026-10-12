import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Form(props: ComponentProps<"form">) {
  return <form data-slot="form" {...props} />;
}

function FormField({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="form-field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function FormLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="form-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      role="alert"
      data-slot="form-message"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
}

export { Form, FormDescription, FormField, FormLabel, FormMessage };
