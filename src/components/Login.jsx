// src/pages/Login.jsx - ZonACha commercial style
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle,
  Store,
  BarChart3,
  Users,
  Settings,
  Shield,
  Sparkles,
  Truck,
  CreditCard,
  Headphones
} from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [currentYear] = useState(new Date().getFullYear())

  // Établissement (nom + logo dynamiques)
  const [etablissement, setEtablissement] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) setRememberMe(true)
  }, [])

  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await AxiosInstance.get('/etablissements/unique/')
        if (response.data) {
          setEtablissement(response.data)
          if (response.data.logo) {
            const baseURL = AxiosInstance.defaults.baseURL || ''
            const p = response.data.logo
            setLogoUrl(p.startsWith('http') ? p : `${baseURL}${p.startsWith('/') ? '' : '/'}${p}`)
          }
        }
      } catch {
        // silencieux
      }
    }
    fetchEtablissement()
  }, [])

  const handleLogin = async (data) => {
    setLoading(true)
    setShowMessage(false)

    try {
      const response = await AxiosInstance.post('login/', {
        email: data.email,
        password: data.password,
      })

      localStorage.setItem('Token', response.data.token)
      localStorage.setItem('User', JSON.stringify(response.data.user))

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      setMessageText('Connexion réussie ! Redirection...')
      setMessageType('success')
      setShowMessage(true)

      setTimeout(() => navigate('/dashboard'), 1500)

    } catch (error) {
      let errorMessage = 'Échec de connexion. Veuillez réessayer.'

      if (error.response) {
        if (error.response.status === 401) errorMessage = 'Email ou mot de passe incorrect'
        else if (error.response.status === 403) errorMessage = 'Compte désactivé.'
        else if (error.response.status === 429) errorMessage = 'Trop de tentatives. Patientez 5 minutes.'
        else if (error.response.data?.error) errorMessage = error.response.data.error
      } else if (error.request) {
        errorMessage = 'Serveur inaccessible. Vérifiez votre connexion.'
      }

      setMessageText(errorMessage)
      setMessageType('error')
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 5000)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Store, text: 'Gestion commerciale complète' },
    { icon: BarChart3, text: 'Tableaux de bord en temps réel' },
    { icon: Users, text: 'Gestion des clients & utilisateurs' },
    { icon: Shield, text: 'Sécurité et permissions avancées' }
  ]

  const bottomBadges = [
    { icon: Truck, text: 'Livraison rapide' },
    { icon: CreditCard, text: 'Paiement sécurisé' },
    { icon: Headphones, text: 'Support 24/7' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6ed] p-4 relative overflow-hidden">

      {/* Décor de fond (blobs orange subtils) */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Message d'alerte */}
      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div className={`alert shadow-lg ${messageType === 'error' ? 'alert-error' : 'alert-success'} border-none`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost">✕</button>
          </div>
        </div>
      )}

      {/* Carte de connexion */}
      <div className="relative card lg:card-side bg-white shadow-2xl max-w-5xl w-full border border-orange-100 overflow-hidden rounded-3xl">

        {/* ================================================================
            COLONNE GAUCHE - Branding ZonACha
            ================================================================ */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 text-white lg:w-5/12 relative overflow-hidden">

          {/* Décor interne */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={etablissement?.nom || 'Logo'} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Store className="w-7 h-7 text-orange-500" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight leading-none">
                  <span className="text-white">Zon</span>
                  <span className="text-orange-200">Acha</span>
                </h1>
                <p className="text-orange-100/90 text-xs font-medium mt-0.5">
                  Plus qu'une boutique, une expérience.
                </p>
              </div>
            </div>

            {/* Titre */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">ERP Commercial</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight mb-2">
                Gérez votre commerce<br />en toute simplicité.
              </h2>
              <p className="text-orange-50/80 text-sm">
                Ventes, stock, clients, finances — tout au même endroit.
              </p>
            </div>

            {/* Fonctionnalités */}
            <div className="space-y-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-orange-50">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bas de colonne : mini-badges */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between gap-3 text-[11px] text-orange-100/90">
              {bottomBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <badge.icon className="w-3.5 h-3.5" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================
            COLONNE DROITE - Formulaire
            ================================================================ */}
        <div className="card-body lg:w-7/12 p-8 md:p-12">

          {/* Header mobile (logo visible sur petit écran) */}
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenue{etablissement?.nom ? ` chez ${etablissement.nom}` : ' sur ZonACha'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Connectez-vous à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">

            {/* Email */}
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text text-sm font-semibold text-slate-700">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className={`input input-bordered w-full pl-10 h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 ${errors.email ? 'input-error border-red-400' : ''}`}
                  {...register('email', {
                    required: "Email requis",
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email invalide" }
                  })}
                />
              </div>
              {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
            </div>

            {/* Mot de passe */}
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text text-sm font-semibold text-slate-700">Mot de passe</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pl-10 pr-11 h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 ${errors.password ? 'input-error border-red-400' : ''}`}
                  {...register('password', {
                    required: "Mot de passe requis",
                    minLength: { value: 6, message: "Minimum 6 caractères" }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-orange-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm border-slate-300 checked:bg-orange-500 checked:border-orange-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-slate-600">Se souvenir de moi</span>
              </label>

              <Link
                to="/request/password_reset"
                className="text-xs font-medium text-orange-500 hover:text-orange-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton Se connecter */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full mt-4 h-12 rounded-xl border-none bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <div className="flex items-center gap-2 font-semibold">
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </div>
              )}
            </button>

            {/* Lien Inscription */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
              <p className="text-xs text-slate-400">
                © {currentYear} {etablissement?.nom || 'ZonACha'} — Tous droits réservés.
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default Login