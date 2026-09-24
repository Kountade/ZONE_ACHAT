import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import logo from '../assets/logo.svg'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Store,
  BarChart3,
  Users,
  Settings
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

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) setRememberMe(true)
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

  // Fonctionnalités remises
  const features = [
    { icon: Store, text: 'Gestion commerciale' },
    { icon: BarChart3, text: 'Tableaux de bord' },
    { icon: Users, text: 'Gestion des utilisateurs' },
    { icon: Settings, text: 'Paramètres avancés' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      
      {/* Message d'alerte */}
      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div className={`alert shadow-lg ${messageType === 'error' ? 'alert-error' : 'alert-success'}`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost">✕</button>
          </div>
        </div>
      )}

      {/* Carte de connexion */}
      <div className="card lg:card-side bg-base-100 shadow-xl max-w-4xl w-full border border-base-300">
        
        {/* Colonne Gauche - Branding avec Logo et Fonctionnalités */}
        <div className="hidden lg:flex flex-col justify-center items-center p-10 bg-primary text-primary-content lg:w-5/12">
          
          {/* Logo */}
          <div className="mb-6 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <img src={logo} alt="ZonAcha Logo" className="w-16 h-16 object-contain" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight">ZonAcha</h1>
          <p className="text-lg mt-1 text-primary-content/80 font-medium">Zone Achat</p>

          {/* Liste des fonctionnalités */}
          <div className="space-y-4 mt-8 w-full max-w-xs">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-content/10 flex items-center justify-center border border-primary-content/10">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne Droite - Formulaire */}
        <div className="card-body lg:w-7/12 p-8 md:p-12">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 lg:hidden">
              <img src={logo} alt="ZonAcha" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-base-content">Bienvenue</h2>
            <p className="text-sm text-base-content/60 mt-1">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
            
            {/* Email */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-base-content/40" />
                </div>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className={`input input-bordered w-full pl-9 ${errors.email ? 'input-error' : ''}`}
                  {...register('email', {
                    required: "Email requis",
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email invalide" }
                  })}
                />
              </div>
              {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
            </div>

            {/* Mot de passe */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium">Mot de passe</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: "Mot de passe requis",
                    minLength: { value: 6, message: "Minimum 6 caractères" }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-base-content/70">Se souvenir de moi</span>
              </label>
              
              <Link to="/request/password_reset" className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton Se connecter */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-4"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </div>
              )}
            </button>

            {/* Lien Inscription */}
            <div className="text-center mt-6">
              <p className="text-sm text-base-content/60">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className="text-center pt-4 border-t border-base-200 mt-6">
              <p className="text-xs text-base-content/40">
                © {currentYear} ZonAcha. Tous droits réservés.
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default Login