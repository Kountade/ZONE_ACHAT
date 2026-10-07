// src/components/auth/RegisterClient.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  UserPlus, Mail, Lock, Phone, MapPin, User,
  CheckCircle, ArrowRight, Info, Clock, Store
} from 'lucide-react'
import MyTextField from '../forms/MyTextField'
import MyPassField from '../forms/MyPassField'
import MyMessage from '../Message'
import AxiosInstance from '../AxiosInstance'
import logo from '../../assets/logo.svg'

// ============================================================
// ⚙️ OPTION DE COMPORTEMENT
// ------------------------------------------------------------
// 'A' : Envoyer password2 au backend (recommandé)
//       → Le backend valide les 2 mots de passe
// 'B' : Ne pas envoyer password2 (validation frontend uniquement)
//       → Nécessite que ClientRegisterSerializer ait password2 required=False
// ============================================================
const SUBMIT_MODE = 'A' // ← Changer en 'B' si vous voulez l'option B

const RegisterClient = () => {
  const navigate = useNavigate()

  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Établissement (nom + logo dynamiques)
  const [etablissement, setEtablissement] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)

  // ============================================================
  // SCHÉMA DE VALIDATION (YUP)
  // ============================================================
  const schema = yup.object({
    email: yup.string()
      .email('Email invalide')
      .required('Email requis')
      .max(200, 'Email trop long'),
    password: yup.string()
      .required('Mot de passe requis')
      .min(8, '8 caractères minimum')
      .matches(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .matches(/[a-z]/, 'Doit contenir au moins une minuscule')
      .matches(/[0-9]/, 'Doit contenir au moins un chiffre'),
    password2: yup.string()
      .required('Confirmation requise')
      .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
    first_name: yup.string()
      .required('Prénom requis')
      .max(200, 'Trop long'),
    last_name: yup.string()
      .required('Nom requis')
      .max(200, 'Trop long'),
    phone_number: yup.string()
      .required('Téléphone requis')
      .matches(/^[0-9+\-\s]{8,20}$/, 'Format de téléphone invalide'),
    address: yup.string()
      .optional()
      .max(300, 'Trop long'),
  })

  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
    }
  })

  // ============================================================
  // CHARGEMENT DE L'ÉTABLISSEMENT
  // ============================================================
  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await AxiosInstance.get('/etablissements/unique/')
        if (response.data) {
          setEtablissement(response.data)
          if (response.data.logo) {
            const baseURL = AxiosInstance.defaults.baseURL || ''
            const p = response.data.logo
            setLogoUrl(
              p.startsWith('http')
                ? p
                : `${baseURL}${p.startsWith('/') ? '' : '/'}${p}`
            )
          }
        }
      } catch {
        // silencieux
      }
    }
    fetchEtablissement()
  }, [])

  // ============================================================
  // SOUMISSION — 2 OPTIONS
  // ============================================================
  const submission = (data) => {
    setIsLoading(true)
    setShowMessage(false)

    // ==========================================================
    // 🔧 Préparation du payload selon l'option choisie
    // ==========================================================
    let submitData

    if (SUBMIT_MODE === 'A') {
      // ✅ OPTION A : Envoyer TOUT, y compris password2
      submitData = { ...data }

      // Nettoyer uniquement les champs OPTIONNELS vides
      // ⚠️ NE PAS toucher à password2
      if (submitData.address === '' || submitData.address === null) {
        delete submitData.address
      }
    } else {
      // ✅ OPTION B : Retirer password2 (validation frontend uniquement)
      const { password2, ...rest } = data
      submitData = { ...rest }

      if (submitData.address === '' || submitData.address === null) {
        delete submitData.address
      }
    }

    console.log(`📝 [Mode ${SUBMIT_MODE}] Données d'inscription client:`, submitData)
    console.log(`   password2 présent dans le payload :`, 'password2' in submitData)

    // ==========================================================
    // APPEL API
    // ==========================================================
    AxiosInstance.post(`register-client/`, submitData)
      .then((response) => {
        console.log('✅ Inscription réussie:', response.data)
        setIsSuccess(true)
      })
      .catch((error) => {
        console.error('❌ Erreur inscription:', error)
        console.error('   Response:', error.response)
        console.error('   Data:', error.response?.data)
        console.error('   Status:', error.response?.status)

        let errorMessage = 'Échec de l\'inscription'

        // ✅ 1. Erreur réseau
        if (!error.response) {
          if (error.request) {
            errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
          } else {
            errorMessage = error.message || 'Une erreur est survenue'
          }
        }
        // ✅ 2. Erreur HTTP
        else {
          const errData = error.response.data

          if (typeof errData === 'string') {
            errorMessage = errData
          } else if (errData?.email) {
            errorMessage = Array.isArray(errData.email) ? errData.email[0] : errData.email
          } else if (errData?.phone_number) {
            errorMessage = Array.isArray(errData.phone_number) ? errData.phone_number[0] : errData.phone_number
          } else if (errData?.password) {
            errorMessage = Array.isArray(errData.password) ? errData.password[0] : errData.password
          } else if (errData?.password2) {
            errorMessage = Array.isArray(errData.password2) ? errData.password2[0] : errData.password2
          } else if (errData?.first_name) {
            errorMessage = Array.isArray(errData.first_name) ? errData.first_name[0] : errData.first_name
          } else if (errData?.last_name) {
            errorMessage = Array.isArray(errData.last_name) ? errData.last_name[0] : errData.last_name
          } else if (errData?.non_field_errors) {
            errorMessage = errData.non_field_errors[0]
          } else if (errData?.detail) {
            errorMessage = errData.detail
          } else if (errData?.error) {
            errorMessage = errData.error
          } else if (error.response.status === 404) {
            errorMessage = 'Endpoint introuvable. Vérifiez la configuration des URLs.'
          } else if (error.response.status === 500) {
            errorMessage = 'Erreur serveur interne. Vérifiez les logs Django.'
          } else {
            errorMessage = JSON.stringify(errData)
          }
        }

        setMessageText(errorMessage)
        setMessageType('error')
        setShowMessage(true)
      })
      .finally(() => setIsLoading(false))
  }

  // ============================================================
  // ÉCRAN DE SUCCÈS
  // ============================================================
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-base-200 py-8 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-lg mx-auto relative z-10">
          <div className="card bg-base-100 shadow-xl border border-primary/20">
            <div className="card-body p-8 text-center space-y-5">

              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mx-auto">
                <CheckCircle className="w-14 h-14 text-success" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-base-content">
                  Inscription réussie !
                </h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Votre compte client a été créé avec succès.
                </p>
              </div>

              <div className="alert alert-warning text-left">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Compte en attente d'approbation</p>
                  <p className="text-xs mt-1">
                    Un administrateur doit valider votre compte avant que vous puissiez
                    accéder à votre espace client (achats, factures, paiements).
                  </p>
                </div>
              </div>

              <Link
                to="/"
                className="btn bg-primary text-primary-content border-primary hover:bg-primary/90 w-full gap-2"
              >
                Retour à la connexion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // FORMULAIRE PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 relative">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Message de notification */}
      {showMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <MyMessage
            text={messageText}
            color={messageType === 'success' ? 'var(--color-success)' : 'var(--color-error)'}
          />
        </div>
      )}

      <div className="w-full max-w-xl mx-auto relative z-10">
        <div className="card bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body p-6">

            {/* En-tête avec logo */}
            <div className="text-center mb-6">
              <div className="inline-flex justify-center items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={etablissement?.nom || 'Logo'}
                      className="h-10 w-10 object-contain rounded-lg"
                    />
                  ) : (
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-10 w-10 object-contain"
                    />
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-base-content">
                {etablissement?.nom || 'ZonACha'}
              </h1>
              <div className="h-0.5 w-12 bg-primary mx-auto my-2"></div>
              <p className="text-sm text-base-content/60">Création de compte client</p>
            </div>

            {/* Info validation admin */}
            <div className="alert bg-warning/10 border border-warning/30 mb-4">
              <Info className="h-4 w-4 text-warning" />
              <span className="text-xs">
                Votre compte sera vérifié par un administrateur avant activation.
              </span>
            </div>

            <form onSubmit={handleSubmit(submission)}>

              {/* Email */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2 text-base-content">
                    <Mail className="h-4 w-4 text-primary" />
                    Email <span className="text-error">*</span>
                  </span>
                </label>
                <MyTextField
                  name="email"
                  control={control}
                  type="email"
                  placeholder="votre@email.com"
                  disabled={isLoading}
                />
              </div>

              {/* Mots de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Lock className="h-4 w-4 text-primary" />
                      Mot de passe <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyPassField
                    name="password"
                    control={control}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/40 text-xs">
                      Min. 8 caractères, 1 majuscule, 1 chiffre
                    </span>
                  </label>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <Lock className="h-4 w-4 text-primary" />
                      Confirmation <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyPassField
                    name="password2"
                    control={control}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Prénom + Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <User className="h-4 w-4 text-primary" />
                      Prénom <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyTextField
                    name="first_name"
                    control={control}
                    type="text"
                    placeholder="Prénom"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                      <User className="h-4 w-4 text-primary" />
                      Nom <span className="text-error">*</span>
                    </span>
                  </label>
                  <MyTextField
                    name="last_name"
                    control={control}
                    type="text"
                    placeholder="Nom"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2 text-base-content">
                    <Phone className="h-4 w-4 text-primary" />
                    Téléphone <span className="text-error">*</span>
                  </span>
                </label>
                <MyTextField
                  name="phone_number"
                  control={control}
                  type="tel"
                  placeholder="+221 XX XXX XX XX"
                  disabled={isLoading}
                />
              </div>

              {/* Adresse */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2 text-base-content">
                    <MapPin className="h-4 w-4 text-primary" />
                    Adresse
                  </span>
                </label>
                <MyTextField
                  name="address"
                  control={control}
                  type="text"
                  placeholder="Votre adresse complète"
                  disabled={isLoading}
                />
              </div>

              {/* Bouton */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn bg-primary text-primary-content border-primary hover:bg-primary/90 w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Créer mon compte client
                    </>
                  )}
                </button>
              </div>

              {/* Séparateur */}
              <div className="divider text-base-content/40 text-xs">OU</div>

              {/* Lien connexion */}
              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-all"
                >
                  Déjà un compte ?
                  <span className="font-semibold">Se connecter</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Mentions légales */}
              <p className="text-center text-xs text-base-content/40 mt-4">
                En créant un compte, vous acceptez nos conditions d'utilisation
              </p>
            </form>

            {/* Footer */}
            <div className="text-center pt-4 mt-4 border-t border-base-200">
              <p className="text-xs text-base-content/40">
                © {new Date().getFullYear()} {etablissement?.nom || 'ZonACha'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default RegisterClient