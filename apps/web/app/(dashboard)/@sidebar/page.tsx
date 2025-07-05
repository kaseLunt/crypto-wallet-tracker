import Link from "next/link";

export default function SidebarPage() {
  const navItems = [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/analytics", label: "Analytics" },
    { href: "/defi", label: "DeFi Positions" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="p-4">
      <h2 className="mb-4 font-semibold text-lg">Navigation</h2>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg px-4 py-2 transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
