import Link from "next/link";
import { Scissors, ArrowLeftRight, Bell, ShieldCheck } from "lucide-react";
import { SHOP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="text-gold-500" size={22} />
            <span className="font-bold text-lg text-white">{SHOP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Scissors size={14} />
            Appointment Swap System
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Can't make your barber
            <br />
            <span className="text-gold-500">appointment?</span>
          </h1>
          <p className="text-dark-400 text-lg max-w-xl mx-auto mb-10">
            List your slot on the swap board and let another client take it —
            you get their appointment in return. No wasted bookings, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-base px-7 py-3">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-base px-7 py-3">
              Sign In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="card text-center">
              <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="text-gold-500" size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">Easy Swaps</h3>
              <p className="text-dark-400 text-sm">
                List your appointment with preferred alternative dates. Other
                clients can offer their own slot in exchange.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-gold-500" size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">Safe & Atomic</h3>
              <p className="text-dark-400 text-sm">
                Every swap is handled in a single database transaction.
                No double-bookings, no lost appointments — ever.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gold-500" size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">Notifications</h3>
              <p className="text-dark-400 text-sm">
                Get notified in-app and by email when someone requests a swap or
                when your request is accepted.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-dark-800 px-6 py-5 text-center text-dark-500 text-sm">
        © {new Date().getFullYear()} {SHOP_NAME}
      </footer>
    </div>
  );
}
