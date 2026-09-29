"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  thumbClassName?: string;
}

export function SwitchRoot({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  className,
  thumbClassName,
  children,
  disabled,
  onClick,
  ...props
}: SwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) {
      setUncontrolledChecked(next);
    }
    onCheckedChange?.(next);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-checked={isChecked ? "" : undefined}
      data-state={isChecked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        "relative flex h-6 w-10 shrink-0 cursor-pointer rounded-full bg-gradient-to-r from-gray-700 from-35% to-gray-200 to-65% bg-[length:6.5rem_100%] bg-[100%_0%] bg-no-repeat p-px shadow-[inset_0_1.5px_2px] shadow-gray-200 outline outline-1 -outline-offset-1 outline-gray-200 transition-[background-position,box-shadow] duration-[125ms] ease-[cubic-bezier(0.26,0.75,0.38,0.45)] before:absolute before:rounded-full before:outline-offset-2 before:outline-blue-800 focus-visible:before:inset-0 focus-visible:before:outline focus-visible:before:outline-2 active:bg-gray-100 data-[checked]:bg-[0%_0%] data-[checked]:active:bg-gray-500 dark:from-purple-600 dark:to-gray-700 dark:shadow-black/75 dark:outline-white/15 dark:data-[checked]:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "bg-[0%_0%]",
        className
      )}
      {...props}
    >
      {children || (
        <SwitchThumb isChecked={isChecked} className={thumbClassName} />
      )}
    </button>
  );
}

export function SwitchThumb({
  isChecked,
  className,
}: {
  isChecked?: boolean;
  className?: string;
}) {
  return (
    <span
      data-checked={isChecked ? "" : undefined}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn(
        "aspect-square h-full rounded-full bg-white shadow-[0_0_1px_1px,0_1px_1px,1px_2px_4px_-1px] shadow-gray-100 transition-transform duration-150 data-[checked]:translate-x-4 dark:shadow-black/25 pointer-events-none block",
        isChecked ? "translate-x-4" : "translate-x-0",
        className
      )}
    />
  );
}

export const Switch = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
});

export default Switch;
