"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdminLoginCard } from "../AdminLoginCard";
import { AdminNav } from "../AdminNav";
import { useAdminSession } from "../useAdminSession";
import { resolveButtonClasses } from "../components/buttonClasses";
import { MailInbox } from "./MailInbox";

export default function AdminMailPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Mailbox
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Read and reply to company mail from one place. Messages stay on the mail server.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className={resolveButtonClasses({ variant: "tint", size: "md" })}
                onClick={() => setReloadKey((value) => value + 1)}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                Refresh
              </button>
              <button
                className={resolveButtonClasses({ variant: "lit", size: "md" })}
                onClick={session.logout}
                type="button"
              >
                <LogOut aria-hidden="true" size={14} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={session.login}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <MailInbox handleUnauthorized={handleUnauthorized} key={reloadKey} token={token} />
        )}
      </div>
    </>
  );
}
