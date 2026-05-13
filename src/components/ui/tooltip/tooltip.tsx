"use client";

/**
 * Tooltip — adapted from HeroUI v3 (literal copy + Faktur imports)
 *
 * Source: heroui/packages/react/src/components/tooltip/tooltip.tsx
 *
 * Faktur adaptations :
 *  - imports from "react-aria-components" (single entry instead of subpaths)
 *  - composeSlotClassName / composeTwRenderProps from "@/lib/compose-tw-render-props"
 *  - dom.div replaced by a plain div (Faktur doesn't ship the polymorphic helper)
 *  - delay/closeDelay defaults applied at Root (Faktur house style)
 *  - legacy <Tooltip content="..." /> wrapper kept for backward compatibility
 *    with the rest of the codebase.
 */

import type {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
} from "react";
import React, { createContext, useContext, useMemo } from "react";
import {
  Focusable as FocusablePrimitive,
  OverlayArrow,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "react-aria-components";

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { tooltipVariants, type TooltipVariants } from "./tooltip.styles";

/* -------------------------------------------------------------------------------------------------
 * Tooltip Context
 * -----------------------------------------------------------------------------------------------*/
type TooltipContextValue = {
  slots?: ReturnType<typeof tooltipVariants>;
};

const TooltipContext = createContext<TooltipContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * Tooltip Root
 * -----------------------------------------------------------------------------------------------*/
type TooltipRootProps = ComponentPropsWithRef<typeof TooltipTriggerPrimitive>;

const TooltipRoot = ({ children, ...props }: TooltipRootProps) => {
  const slots = useMemo(() => tooltipVariants(), []);

  return (
    <TooltipContext.Provider value={{ slots }}>
      <TooltipTriggerPrimitive
        delay={400}
        closeDelay={200}
        data-slot="tooltip-root"
        {...props}
      >
        {children}
      </TooltipTriggerPrimitive>
    </TooltipContext.Provider>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Content
 * -----------------------------------------------------------------------------------------------*/
interface TooltipContentProps
  extends Omit<ComponentPropsWithRef<typeof TooltipPrimitive>, "children">,
    TooltipVariants {
  showArrow?: boolean;
  children: React.ReactNode;
}

const TooltipContent = ({
  children,
  className,
  offset: offsetProp,
  showArrow = false,
  ...props
}: TooltipContentProps) => {
  const { slots } = useContext(TooltipContext);
  const offset = offsetProp ? offsetProp : showArrow ? 7 : 3;

  return (
    <TooltipPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.base())}
      offset={offset}
    >
      {children}
    </TooltipPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Arrow
 * -----------------------------------------------------------------------------------------------*/
type TooltipArrowProps = Omit<
  ComponentPropsWithRef<typeof OverlayArrow>,
  "children"
> & {
  children?: React.ReactNode;
};

const TooltipArrow = ({ children, className, ...props }: TooltipArrowProps) => {
  const defaultArrow = (
    <svg
      data-slot="overlay-arrow"
      fill="none"
      height="12"
      viewBox="0 0 12 12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0C5.48483 8 6.5 8 12 0Z" />
    </svg>
  );

  const arrow = React.isValidElement(children)
    ? React.cloneElement(
        children as ReactElement<{
          className?: string;
          "data-slot"?: "overlay-arrow";
        }>,
        {
          "data-slot": "overlay-arrow",
        },
      )
    : defaultArrow;

  return (
    <OverlayArrow data-slot="tooltip-arrow" {...props} className={className}>
      {arrow}
    </OverlayArrow>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Trigger
 * -----------------------------------------------------------------------------------------------*/
interface TooltipTriggerProps {
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
}

const TooltipTrigger = ({
  children,
  className,
  asChild,
  ...props
}: TooltipTriggerProps) => {
  const { slots } = useContext(TooltipContext);

  // asChild: render children as-is, letting them inherit the
  // react-aria-components focus tracking via FocusablePrimitive.
  if (asChild) {
    return (
      <FocusablePrimitive>{children as React.ReactElement<any, any>}</FocusablePrimitive>
    );
  }

  return (
    <FocusablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="tooltip-trigger"
        role="button"
        {...(props as Record<string, unknown>)}
      >
        {children}
      </div>
    </FocusablePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Legacy <Tooltip content="..." /> — simple wrapper used across the codebase
 * Includes the arrow by default to match HeroUI v3 storybook examples.
 * -----------------------------------------------------------------------------------------------*/
interface LegacyTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  showArrow?: boolean;
  className?: string;
  delay?: number;
}

function Tooltip({
  content,
  children,
  side = "top",
  showArrow = true,
  className,
  delay = 300,
}: LegacyTooltipProps) {
  return (
    <TooltipRoot delay={delay}>
      {children}
      <TooltipContent
        placement={side}
        showArrow={showArrow}
        className={className}
        // Force the requested placement even when the trigger is near
        // the viewport edge. Without this, react-aria flips the tooltip
        // to the opposite side (e.g. top → bottom) the moment there's
        // not "enough" room.
        shouldFlip={false}
      >
        {showArrow && <TooltipArrow />}
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow };

export type {
  TooltipRootProps,
  TooltipArrowProps,
  TooltipContentProps,
  TooltipTriggerProps,
  LegacyTooltipProps,
};
