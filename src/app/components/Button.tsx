import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import {
  resolveButtonClasses,
  type ButtonSize,
  type ButtonSurface,
  type ButtonTone,
  type ButtonVariant
} from "./buttonClasses";

interface ButtonOwnProps {
  /** `lit` = the page's one main action, `tint` = secondary, `ghost` = text-only. */
  variant?: ButtonVariant;
  /** `danger` on `lit` is for the final destructive confirm only. */
  tone?: ButtonTone;
  size?: ButtonSize;
  /** `dark` on photos, dark heroes and the blue eSIM card. */
  surface?: ButtonSurface;
  /** The app icon's orbit dot. One per page: the main buy/continue/install. */
  hero?: boolean;
}

type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    /** Shows a spinner and blocks presses; keep the label as it is. */
    loading?: boolean;
  };

function join(classes: string, className?: string) {
  return className ? `${classes} ${className}` : classes;
}

/** Spinner in the label colour. */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
    />
  );
}

/**
 * The shared "lit pill" button — the web twin of velocity-eSim's `Button`.
 * The call site only picks props; every class comes from `resolveButtonClasses`.
 */
export function Button({
  variant,
  tone,
  size,
  surface,
  hero,
  loading = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  // Loading keeps the live paint (spinner on the lit pill); only a real disable goes grey.
  const classes = resolveButtonClasses({
    variant,
    tone,
    size,
    surface,
    hero: hero && !loading,
    disabled: Boolean(disabled) && !loading
  });
  return (
    <button
      className={join(classes, loading ? `${className ?? ""} cursor-progress`.trim() : className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

type LinkButtonProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
    className?: string;
  };

/** Same visuals as `Button`, rendered as an `<a>` for navigational CTAs. */
export function LinkButton({ variant, tone, size, surface, hero, className, ...rest }: LinkButtonProps) {
  return <a className={join(resolveButtonClasses({ variant, tone, size, surface, hero }), className)} {...rest} />;
}
