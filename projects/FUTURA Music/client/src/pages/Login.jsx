import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../utils/api.js";
import { validateLoginForm } from "../utils/validation.js";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateLoginForm(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      const data = await api.post("/api/auth/login", form);
      localStorage.setItem("token", data.token);
      login(data.token, data.user);
      navigate("/");
    } catch (e) {
      const errorMsg =
        e.message.includes("401") || e.message.includes("Invalid")
          ? "Incorrect email or password. Please try again."
          : "Server connection failed. Please try again later.";
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left panel: stacks on mobile, side-by-side on desktop */}
          <aside
            className="p-6 sm:p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10"
            style={{
              background:
                "radial-gradient(900px circle at 20% 20%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(900px circle at 80% 70%, rgba(168,85,247,0.18), transparent 55%)",
            }}
          >
            <div className="text-2xl font-extrabold tracking-wide">
              <span className="text-gradient">FUTURA</span>
            </div>

            <p className="mt-3 text-white/70 text-sm leading-relaxed">
              Stream your favorites, build playlists, and keep your vibe going.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-white/60">
              <li>• Quick access to recently played</li>
              <li>• Save tracks to playlists</li>
              <li>• Clean, fast player controls</li>
            </ul>

            <div className="mt-8 text-xs text-white/35">
              © {new Date().getFullYear()} FUTURA Music
            </div>
          </aside>

          {/* Right form */}
          <section className="p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight text-center md:text-left">
              <span className="text-gradient">Login</span>
            </h1>
            <p className="mt-2 text-sm text-white/60 text-center md:text-left">
              Welcome back. Sign in to continue.
            </p>

            {errors.length > 0 && (
              <div className="mt-6 p-3 rounded-xl bg-red-500/15 border border-red-500/40">
                {errors.map((err, i) => (
                  <p key={i} className="text-red-200 text-sm">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <input
                className="px-4 py-3 rounded-xl bg-black/35 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 placeholder-white/40"
                name="email"
                placeholder="Email"
                type="email"
                required
                value={form.email}
                onChange={onChange}
              />

              <input
                className="px-4 py-3 rounded-xl bg-black/35 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 placeholder-white/40"
                name="password"
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={onChange}
              />

              <button
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md hover:shadow-purple-500/40 transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "..." : "Login"}
              </button>
            </form>

            <p className="text-sm text-white/60 mt-6 text-center md:text-left">
              New to the platform?{" "}
              <Link
                to="/signup"
                className="underline text-purple-300 hover:text-purple-200"
              >
                Create Account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}