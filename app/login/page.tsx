'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gov-900 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold-600/4 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-gold-400 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/50 border border-gold-600/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gov-700 border border-gold-600/20 mb-4">
              <Shield className="w-7 h-7 text-gold-400" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Accès Sécurisé</h1>
            <p className="text-stone-500 text-sm mt-1">Administration — État de San Andreas</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gov-800 border border-stone-700 focus:border-gold-600/50 rounded-xl px-4 py-3 text-white outline-none transition-all text-sm"
                placeholder="Nom d'utilisateur"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gov-800 border border-stone-700 focus:border-gold-600/50 rounded-xl px-4 py-3 pr-12 text-white outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-gold-400 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? 'Authentification...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-800 text-center">
            <p className="text-stone-600 text-xs">
              Accès entreprise via PIN? Accédez directement à la page de votre entreprise.
            </p>
          </div>
        </div>

        <p className="text-center text-stone-700 text-xs mt-6">
          Système sécurisé — Accès non autorisé interdit
        </p>
      </div>
    </div>
  )
}
