// src/components/Register.jsx - Version simplifiée
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { 
    UserPlus, Mail, Lock, User, Phone, 
    Shield, ArrowRight, Store, UserCog
} from 'lucide-react'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyMessage from './Message'
import AxiosInstance from './AxiosInstance'
import logo from '../assets/logo.svg'

// Configuration des rôles (Admin & Vendeur)
const ROLES = [
    { 
        value: 'admin', 
        label: 'Administrateur', 
        description: 'Accès total à toutes les fonctionnalités', 
        icon: Shield,
        requiresApproval: false
    },
    { 
        value: 'vendeur', 
        label: 'Vendeur', 
        description: 'Gestion des ventes et des clients', 
        icon: Store,
        requiresApproval: false
    }
]

const Register = () => {
    const navigate = useNavigate()
    const [currentYear] = useState(new Date().getFullYear())

    const [showMessage, setShowMessage] = useState(false)
    const [messageText, setMessageText] = useState('')
    const [messageType, setMessageType] = useState('error')
    const [isLoading, setIsLoading] = useState(false)

    // Schéma de validation
    const schema = yup.object({
        email: yup.string()
            .email('Email invalide')
            .required('Email requis')
            .max(200, 'Email trop long'),
        password: yup.string()
            .required('Mot de passe requis')
            .min(8, '8 caractères minimum')
            .matches(/[A-Z]/, 'Doit contenir au moins une majuscule')
            .matches(/[0-9]/, 'Doit contenir au moins un chiffre'),
        password2: yup.string()
            .required('Confirmation requise')
            .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
        role: yup.string()
            .required('Rôle requis')
            .oneOf(['admin', 'vendeur']),
        first_name: yup.string().max(200, 'Trop long').optional(),
        last_name: yup.string().max(200, 'Trop long').optional(),
        username: yup.string().max(200, 'Trop long').optional(),
        phone_number: yup.string()
            .matches(/^[0-9+\-\s]{8,20}$/, 'Format de téléphone invalide')
            .optional(),
        address: yup.string().optional(),
        birthday: yup.date().nullable().optional().max(new Date(), 'Date de naissance invalide'),
    })

    const { handleSubmit, control, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { 
            role: 'vendeur',
            first_name: '', 
            last_name: '', 
            username: '',
            phone_number: '',
            address: '',
            birthday: null
        }
    })

    const watchedRole = watch('role')

    const submission = (data) => {
        setIsLoading(true)
        setShowMessage(false)

        const { password2, ...submitData } = data
        
        // Nettoyer les champs vides
        Object.keys(submitData).forEach(key => {
            if (submitData[key] === '' || submitData[key] === null) {
                delete submitData[key]
            }
        })

        AxiosInstance.post(`register/`, submitData)
            .then((response) => {
                const roleInfo = ROLES.find(r => r.value === data.role)
                const roleLabel = roleInfo?.label || data.role
                
                setMessageText(`✅ Inscription réussie ! Compte ${roleLabel} créé avec succès.`)
                setMessageType('success')
                setShowMessage(true)
                
                // Rediriger vers la page de connexion après 3 secondes
                setTimeout(() => navigate('/'), 3000)
            })
            .catch((error) => {
                console.error('❌ Erreur inscription:', error)
                let errorMessage = 'Échec de l\'inscription'
                
                if (error.response?.data?.email) {
                    errorMessage = Array.isArray(error.response.data.email) 
                        ? error.response.data.email[0] 
                        : 'Cet email est déjà utilisé'
                } else if (error.response?.data?.phone_number) {
                    errorMessage = Array.isArray(error.response.data.phone_number)
                        ? error.response.data.phone_number[0]
                        : 'Numéro de téléphone invalide'
                } else if (error.response?.data?.password) {
                    errorMessage = Array.isArray(error.response.data.password)
                        ? error.response.data.password[0]
                        : 'Mot de passe invalide'
                } else if (error.response?.data?.non_field_errors) {
                    errorMessage = error.response.data.non_field_errors[0]
                } else if (error.request) {
                    errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
                } else {
                    errorMessage = error.message || 'Une erreur est survenue'
                }
                
                setMessageText(errorMessage)
                setMessageType('error')
                setShowMessage(true)
            })
            .finally(() => setIsLoading(false))
    }

    return (
        <div className="min-h-screen bg-base-200 py-8 px-4 flex justify-center items-center">
            
            {/* Message de notification */}
            {showMessage && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <MyMessage 
                        text={messageText} 
                        color={messageType === 'success' ? 'var(--color-success)' : 'var(--color-error)'} 
                    />
                </div>
            )}

            <div className="w-full max-w-2xl">
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body p-6 md:p-8">
                        
                        {/* En-tête avec logo */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <img 
                                    src={logo} 
                                    alt="ZonAcha Logo" 
                                    className="w-10 h-10 object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-base-content">ZonAcha</h1>
                            <p className="text-sm font-medium text-primary mt-1">Zone Achat</p>
                            <p className="text-sm text-base-content/60 mt-2">Création de compte</p>
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

                            {/* Coordonnées */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium text-base-content">Prénom</span>
                                    </label>
                                    <MyTextField name="first_name" control={control} type="text" placeholder="Prénom" disabled={isLoading} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium text-base-content">Nom</span>
                                    </label>
                                    <MyTextField name="last_name" control={control} type="text" placeholder="Nom" disabled={isLoading} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium text-base-content">Nom d'utilisateur</span>
                                    </label>
                                    <MyTextField name="username" control={control} type="text" placeholder="Pseudo" disabled={isLoading} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium flex items-center gap-2 text-base-content">
                                            <Phone className="h-4 w-4 text-primary" />
                                            Téléphone
                                        </span>
                                    </label>
                                    <MyTextField name="phone_number" control={control} type="tel" placeholder="+221 XX XXX XX XX" disabled={isLoading} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium text-base-content">Adresse</span>
                                    </label>
                                    <MyTextField name="address" control={control} type="text" placeholder="Votre adresse" disabled={isLoading} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium text-base-content">Date de naissance</span>
                                    </label>
                                    <MyTextField name="birthday" control={control} type="date" disabled={isLoading} />
                                </div>
                            </div>

                            <div className="divider text-base-content/40 text-xs mt-2">INFORMATIONS PROFESSIONNELLES</div>

                            {/* Rôle - Sélection Admin ou Vendeur (Simplifiée) */}
                            <div className="form-control w-full mb-4">
                                <label className="label">
                                    <span className="label-text font-medium flex items-center gap-2 text-base-content">
                                        <UserCog className="h-4 w-4 text-primary" />
                                        Rôle <span className="text-error">*</span>
                                    </span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                    {ROLES.map((role) => {
                                        const IconComponent = role.icon
                                        const isSelected = watchedRole === role.value
                                        return (
                                            <label
                                                key={role.value}
                                                className={`
                                                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                                                    ${isSelected 
                                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                                        : 'border-base-200 hover:border-primary/30'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    value={role.value}
                                                    {...control.register('role')}
                                                    className="radio radio-primary radio-sm"
                                                    disabled={isLoading}
                                                />
                                                <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-base-content/40'}`} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-base-content">{role.label}</p>
                                                    <p className="text-xs text-base-content/50">{role.description}</p>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                                {errors.role && (
                                    <span className="text-error text-xs mt-1">{errors.role.message}</span>
                                )}
                            </div>

                            {/* Bouton d'action */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Inscription en cours...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5" />
                                            S'inscrire
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Séparateur */}
                            <div className="divider text-base-content/40 text-xs mt-6">OU</div>

                            {/* Lien connexion */}
                            <div className="text-center mt-2">
                                <Link to="/" className="text-sm text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-all">
                                    Déjà un compte ?
                                    <span className="font-semibold">Se connecter</span>
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>

                            {/* Mentions légales */}
                            <p className="text-center text-xs text-base-content/40 mt-6">
                                En créant un compte, vous acceptez nos conditions d'utilisation
                            </p>
                        </form>

                        {/* Footer */}
                        <div className="text-center pt-4 mt-6 border-t border-base-200">
                            <p className="text-xs text-base-content/40">
                                © {currentYear} ZonAcha. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
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

export default Register