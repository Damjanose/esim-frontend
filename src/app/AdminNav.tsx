import Link from "next/link";

const adminLinks = [
  { href: "/xloginy", label: "Purchase dashboard" },
  { href: "/xerrors", label: "Error Inbox" }
];

export function AdminNav() {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-2 text-sm font-bold shadow-sm">
      {adminLinks.map((link) => (
        <Link
          className="rounded px-3 py-2 text-slate-800 transition hover:bg-slate-100 hover:text-slate-950"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
