"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdminLoginCard } from "../AdminLoginCard";
import { AdminNav } from "../AdminNav";
import { useAdminSession } from "../useAdminSession";
import { SupportInbox } from "./SupportInbox";

export default function AdminSupportPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="flex min-h-screen bg-cloud">
      <AdminNav />
      <div className="min-w-0 flex-1 px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Support inbox
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Live chat with travelers. Unread threads wait here until you open them; solved issues
              move to the archive and disappear from the reporter&apos;s app.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan"
                onClick={() => setReloadKey((value) => value + 1)}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                Refresh
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90"
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
          <SupportInbox handleUnauthorized={handleUnauthorized} key={reloadKey} token={token} />
        )}
      </div>
    </div>
  );
}
