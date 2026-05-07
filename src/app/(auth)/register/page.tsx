"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { SHOP_NAME } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (signInResult?.error) {
        toast.error("Account created. Please sign in.");
        router.push("/login");
      } else {
        toast.success("Welcome! Your account has been created.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
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
          <p className="text-dark-400 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
            <p className="text-xs text-dark-500 mt-1">
              Use the same name as on the booking site
            </p>
          </div>

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
            <p className="text-xs text-dark-500 mt-1">
              Use the same email as on the booking site
            </p>
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-dark-400 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
