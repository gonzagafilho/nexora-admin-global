"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Falha ao autenticar.");
        setLoading(false);
        return;
      }

      router.replace("/control");
    } catch {
      setError("Erro de comunicação com o serviço de autenticação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Nexora Global Control</h1>
        <p className="mt-1 text-sm text-slate-500">Faça login para acessar o painel.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="admin@nexora.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Sua senha"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

