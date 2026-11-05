import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Waves,
  ChartNoAxesCombined,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import proteusLogo from "../../assets/proteus-logo-transparent.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password }, remember);

      // Login successful - tokens stored automatically by auth service
      console.log("Login successful:", res.data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      // Backend auth errors use { error: "..." }; other endpoints use { message: "..." }
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  
return (
  <div className="grid min-h-screen w-full bg-page text-ink lg:grid-cols-2">

    {/* LEFT SIDE: Branding */}
    <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-linear-to-br from-[#EAF7FF] via-[#D9EEFC] to-[#BEDFF3] px-12 py-12 lg:flex xl:px-16">

      {/* Decorative Water-Inspired Elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full border-[45px] border-white/30"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full border-[55px] border-white/20"
      />

      {/* Small Branding Label */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-xs font-semibold text-brand">
          <Waves className="h-4 w-4" />
          Water Quality Monitoring
        </div>
      </div>

      {/* Main Branding Content */}
      <div className="relative z-10 max-w-lg">

        <img
          src={proteusLogo}
          alt="Proteus"
          className="mb-10 h-auto w-[350px] max-w-full object-contain"
        />

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink xl:text-4xl">
          A clearer view of water quality.
        </h1>

        <p className="mt-5 max-w-md text-base leading-7 text-[#466982]">
          Monitor water quality measurements, explore historical
          trends and manage monitoring reports in one place.
        </p>

        {/* Feature Highlights */}
        <div className="mt-9 flex flex-wrap gap-3">

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-medium text-ink">
            <Waves className="h-4 w-4 text-brand" />
            Live Monitoring
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-medium text-ink">
            <ChartNoAxesCombined className="h-4 w-4 text-brand" />
            Analytics
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-medium text-ink">
            <FileText className="h-4 w-4 text-brand" />
            Reports
          </div>

        </div>
      </div>

      {/* Bottom Text */}
      <p className="relative z-10 text-xs text-muted">
        Proteus · Water Quality Monitoring Platform
      </p>

    </section>

    {/* RIGHT SIDE: Login Form */}
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

      <div className="w-full max-w-[460px]">

        {/* Mobile Logo */}
        <div className="mb-8 lg:hidden">
          <img
            src={proteusLogo}
            alt="Proteus"
            className="block h-auto w-[190px] max-w-full object-contain"
          />

          <p className="mt-2 text-sm text-muted">
            Water Quality Monitoring Platform
          </p>
        </div>

        {/* Form Introduction */}
        <div className="mb-7">


          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-muted">
            Sign in to access your water quality monitoring dashboard.
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(15,41,66,0.06)] sm:p-8">

          <form onSubmit={onSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-ink"
              >
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  h-12 w-full rounded-xl
                  border border-line bg-white
                  px-4 text-sm text-ink
                  placeholder:text-slate-400
                  outline-none transition-all
                  hover:border-brand/50
                  focus:border-brand
                  focus:ring-2 focus:ring-brand/20
                "
              />
            </div>

            {/* Password */}
            <div>

              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-ink"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}

                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  h-12 w-full rounded-xl
                  border border-line bg-white
                  px-4 text-sm text-ink
                  placeholder:text-slate-400
                  outline-none transition-all
                  hover:border-brand/50
                  focus:border-brand
                  focus:ring-2 focus:ring-brand/20
                "
              />
            </div>

            {/* Remember Me */}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#0369A1]"
              />

              Remember me
            </label>

            {/* Login Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                flex h-12 w-full items-center
                justify-center gap-2
                rounded-xl bg-brand
                text-sm font-semibold text-white
                transition-colors duration-200
                hover:bg-brand-hover
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-brand
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            {/* Security Information */}
            <p className="border-t border-line pt-4 text-xs leading-5 text-muted">
              By signing in you agree to the terms of use. This application may
              log access for security audits.
            </p>

          </form>

        </div>
      </div>
    </main>
  </div>
);

}
