"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "./components/Button";

type AdminLoginCardProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  isLoggingIn: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const inputClasses =
  "h-11 w-full rounded-xl border border-outline bg-white px-3.5 text-sm text-brandInk outline-none transition placeholder:text-onSurfaceVariant/60 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20";

export function AdminLoginCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  isLoggingIn,
  onSubmit
}: AdminLoginCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mx-auto mt-[12vh] w-full max-w-sm">
      <form
        aria-busy={isLoggingIn}
        className="rounded-2xl border border-outline/70 bg-white p-7 shadow-brandCard"
        onSubmit={onSubmit}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brandInk text-white">
          <LockKeyhole aria-hidden="true" size={20} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-brandInk">Admin sign in</h1>
        <p className="mt-1 text-sm text-onSurfaceVariant">Use your admin account to continue.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brandInk" htmlFor="admin-email">
              Email
            </label>
            <input
              autoComplete="email"
              autoFocus
              className={inputClasses}
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brandInk" htmlFor="admin-password">
              Password
            </label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className={`${inputClasses} pr-11`}
                id="admin-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-onSurfaceVariant transition hover:bg-surfaceBright hover:text-brandInk focus-visible:outline focus-visible:outline-2 focus-visible:outline-brandBlue"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="mt-6 w-full" loading={isLoggingIn} type="submit">
          Sign in
        </Button>
      </form>
    </div>
  );
}
