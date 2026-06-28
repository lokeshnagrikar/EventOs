"use client";

import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface IconProps extends Omit<React.ComponentPropsWithoutRef<typeof IconifyIcon>, "icon"> {
  /**
   * The name of the icon registered in the centralized ICONS registry.
   */
  name: IconName;
  /**
   * Additional Tailwind utility classes.
   */
  className?: string;
  /**
   * The size of the icon in pixels or relative units. Defaults to 18px.
   */
  size?: number | string;
}

/**
 * Reusable icon component mapped to the centralized Iconify registry.
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, className, size = 18, ...props }, ref) => {
    const iconId = ICONS[name];

    if (!iconId) {
      console.warn(`[DesignSystem] Icon name "${name}" is not registered in ICONS.`);
      return null;
    }

    return (
      <IconifyIcon
        icon={iconId}
        className={cn("inline-block shrink-0 select-none", className)}
        width={size}
        height={size}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";
export default Icon;
