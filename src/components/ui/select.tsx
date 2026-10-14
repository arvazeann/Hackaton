"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";

const EMPTY_ITEM_VALUE = "__ruanglagi_empty__";

type SelectProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange" | "name" | "form"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  form?: string;
};

function Select({
  value,
  defaultValue = "",
  onValueChange,
  name,
  form,
  disabled,
  ...props
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  return (
    <>
      <SelectPrimitive.Root
        data-slot="select"
        {...props}
        value={selectedValue || EMPTY_ITEM_VALUE}
        onValueChange={(nextValue) => {
          const normalizedValue =
            nextValue === EMPTY_ITEM_VALUE ? "" : nextValue;
          if (value === undefined) setUncontrolledValue(normalizedValue);
          onValueChange?.(normalizedValue);
        }}
        disabled={disabled}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          form={form}
          value={selectedValue}
          disabled={disabled}
        />
      )}
    </>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "inline-flex min-h-11 min-w-36 items-center justify-between gap-2 rounded-pill border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors duration-control ease-soft hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus data-[placeholder]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 opacity-70"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-menu ring-1 ring-foreground/5 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-control ease-soft",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="max-h-[var(--radix-select-content-available-height)] p-0.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      {...props}
      value={value === "" ? EMPTY_ITEM_VALUE : value}
      className={cn(
        "relative flex min-h-11 cursor-default select-none items-center rounded-xl py-2 pr-3 pl-9 text-sm outline-none transition-colors duration-control ease-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground data-[state=checked]:font-medium",
        className,
      )}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center text-accent-bright">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
