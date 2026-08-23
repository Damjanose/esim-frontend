import { FormEvent } from "react";
import { LockKeyhole } from "lucide-react";

type AdminLoginCardProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  isLoggingIn: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminLoginCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  isLoggingIn,
  onSubmit
}: AdminLoginCardProps) {
  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="h-1 w-full bg-gradient-to-r from-cyan to-aqua" />
        <form className="p-7" onSubmit={onSubmit}>
          <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-midnight to-ink text-aqua shadow-glow">
            <LockKeyhole aria-hidden="true" size={20} />
          </span>
          <h2 className="font-display text-xl font-black text-midnight">Admin sign in</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">Restricted access</p>

          <label className="mt-5 block text-sm font-bold text-midnight" htmlFor="admin-email">
            Email
          </label>
          <input
            autoComplete="email"
            className="mt-1.5 h-11 w-full rounded-xl border border-line px-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
            id="admin-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <label className="mt-4 block text-sm font-bold text-midnight" htmlFor="admin-password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="mt-1.5 h-11 w-full rounded-xl border border-line px-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
            id="admin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}

          <button
            className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-midnight to-ink text-sm font-black text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoggingIn}
            type="submit"
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
