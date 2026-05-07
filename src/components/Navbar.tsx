"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Scissors,
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOP_NAME } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "My Appointments", icon: CalendarDays },
  { href: "/swap-board", label: "Swap Board", icon: ArrowLeftRight },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unreadCount ?? 0);
        }
      } catch {
        // silent
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-dark-800 bg-dark-950/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
              <Scissors className="text-gold-500" size={20} />
              <span className="hidden sm:inline">{SHOP_NAME}</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                const isNotifications = href === "/notifications";
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-dark-800 text-white"
                        : "text-dark-400 hover:text-dark-100 hover:bg-dark-900"
                    )}
                  >
                    <Icon size={15} />
                    {label}
                    {isNotifications && unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-dark-950 text-[10px] font-bold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-dark-400 text-sm truncate max-w-[140px]">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-secondary text-sm px-3 py-1.5 hidden md:flex"
                title="Sign out"
              >
                <LogOut size={15} />
                Sign out
              </button>
              <button
                className="md:hidden p-2 text-dark-400 hover:text-white"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-dark-950/95 pt-14 animate-fade-in">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              const isNotifications = href === "/notifications";
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors relative",
                    isActive
                      ? "bg-dark-800 text-white"
                      : "text-dark-400 hover:text-dark-100 hover:bg-dark-900"
                  )}
                >
                  <Icon size={18} />
                  {label}
                  {isNotifications && unread > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-gold-500 text-dark-950 text-xs font-bold flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="border-t border-dark-800 mt-3 pt-3">
              <p className="px-4 text-dark-500 text-sm mb-2">{session?.user?.name}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-dark-400 hover:text-red-400 hover:bg-dark-900 w-full"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
