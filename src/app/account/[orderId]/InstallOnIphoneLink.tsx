"use client";

import { Smartphone } from "lucide-react";
import { LinkButton } from "../../components/Button";
import { reportInstallAttempt } from "./installAttempt";

export function InstallOnIphoneLink({ href, orderId }: { href: string; orderId: number }) {
  return (
    <LinkButton className="mt-4 w-full" href={href} onClick={() => reportInstallAttempt(orderId)} variant="tint">
      <Smartphone aria-hidden="true" size={16} />
      Install on this iPhone
    </LinkButton>
  );
}
