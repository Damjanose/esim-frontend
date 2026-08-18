import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { resolveButtonClasses, type ButtonSize, type ButtonTone, type ButtonVariant } from "./buttonClasses";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

type ButtonProps = ButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
};

/** Shared CTA/action button — see docs/design/mobile-design-system.md. */
export function Button({ variant, tone, size, className, disabled, ...rest }: ButtonProps) {
  const classes = resolveButtonClasses({ variant, tone, size, disabled });
  return (
    <button
      className={className ? `${classes} ${className}` : classes}
      disabled={disabled}
      {...rest}
    />
  );
}

type LinkButtonProps = ButtonOwnProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
  className?: string;
};

/** Same visuals as `Button`, rendered as an `<a>` for navigational CTAs. */
export function LinkButton({ variant, tone, size, className, ...rest }: LinkButtonProps) {
  const classes = resolveButtonClasses({ variant, tone, size });
  return <a className={className ? `${classes} ${className}` : classes} {...rest} />;
}
