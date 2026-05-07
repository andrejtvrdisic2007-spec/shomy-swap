"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scissors, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { SHOP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/15 mb-4">
            <Scissors className="text-gold-500" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">{SHOP_NAME}</h1>
          <p className="text-dark-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-dark-400 text-sm mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-gold-400 hover:text-gold-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
