// src/components/users/UtilisateurForm.jsx
// Formulaire de création/modification d'un utilisateur - Pleine largeur

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, User, Mail, Phone, MapPin,
  Calendar, Lock, UserCog, Shield, AlertCircle,
  CheckCircle, Loader2, Eye, EyeOff, Wifi, WifiOff,
  UserPlus, BadgeCheck, Users, UserCheck,
  AtSign, Home, Calendar as CalendarIcon, Smartphone,
  Key, Award, BookOpen, Building2, Globe
} from 'lucide-react';

const UtilisateurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'eleve',
    phone_number: '',
    address: '',
    birthday: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('eleve');

  // ============================================================
  // SURVEILLER LA CONNEXION
  // ============================================================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES (pour édition)
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      if (!isEditing) return;
      
      setLoadingData(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Charger l'utilisateur
        const userRes = await axiosInstance.get(`/users/${id}/`, headers);
        const user = userRes.data;
        
        setFormData({
          email: user.email || '',
          username: user.username || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || 'eleve',
          phone_number: user.phone_number || '',
          address: user.address || '',
          birthday: user.birthday || '',
          is_active: user.is_active !== undefined ? user.is_active : true,
          password: '',
          password_confirm: ''
        });
        setSelectedRole(user.role || 'eleve');

        // Charger l'utilisateur connecté
        try {
          const meRes = await axiosInstance.get('/users/me/', headers);
          setCurrentUser(meRes.data);
        } catch (meError) {
          console.warn('⚠️ Impossible de charger le profil:', meError);
        }

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 404) {
          showNotification('Utilisateur non trouvé', 'error');
          setTimeout(() => navigate('/utilisateurs'), 1500);
        } else if (error.response?.status === 403) {
          showNotification('Vous n\'avez pas la permission de voir cet utilisateur', 'error');
          setTimeout(() => navigate('/utilisateurs'), 1500);
        } else {
          showNotification('Erreur de chargement', 'error');
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, isEditing, navigate]);

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'role') {
      setSelectedRole(value);
    }
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      // Préparer les données
      const data = { ...formData };
      
      // Si le mot de passe est vide en édition, on ne l'envoie pas
      if (isEditing && !data.password) {
        delete data.password;
        delete data.password_confirm;
      } else {
        // Sinon on vérifie la correspondance
        if (data.password !== data.password_confirm) {
          setErrors({ password_confirm: 'Les mots de passe ne correspondent pas' });
          setLoading(false);
          return;
        }
        // On retire password_confirm avant l'envoi
        delete data.password_confirm;
      }

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/users/${id}/`, data, headers);
        showNotification('Utilisateur modifié avec succès', 'success');
      } else {
        response = await axiosInstance.post('/users/', data, headers);
        showNotification('Utilisateur créé avec succès', 'success');
      }

      setTimeout(() => navigate(`/utilisateurs/${response.data.id}`), 1500);

    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      if (error.response?.status === 400) {
        setErrors(error.response.data || {});
        showNotification('Veuillez corriger les erreurs', 'error');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission', 'error');
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ROLES OPTIONS
  // ============================================================
  const roleOptions = [
    { value: 'super_admin', label: 'Super Administrateur', icon: Shield, color: 'text-error', bg: 'bg-error/10' },
    { value: 'direction', label: 'Direction', icon: UserCog, color: 'text-primary', bg: 'bg-primary/10' },
    { value: 'administratif', label: 'Personnel Administratif', icon: UserCheck, color: 'text-info', bg: 'bg-info/10' },
    { value: 'enseignant', label: 'Enseignant', icon: User, color: 'text-warning', bg: 'bg-warning/10' },
    { value: 'eleve', label: 'Élève', icon: Users, color: 'text-success', bg: 'bg-success/10' },
    { value: 'vie_scolaire', label: 'Vie Scolaire', icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { value: 'alumni', label: 'Ancien Élève', icon: User, color: 'text-gray-500', bg: 'bg-gray-100' }
  ];

  const getRoleInfo = (roleValue) => {
    return roleOptions.find(r => r.value === roleValue) || roleOptions[4];
  };

  const roleInfo = getRoleInfo(selectedRole);
  const RoleIcon = roleInfo.icon;

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4 animate-pulse">
            Chargement de l'utilisateur...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/utilisateurs')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${roleInfo.bg}`}>
                {isEditing ? <UserCog className={`w-7 h-7 ${roleInfo.color}`} /> : <UserPlus className={`w-7 h-7 ${roleInfo.color}`} />}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditing ? `Modification de ${formData.first_name || ''} ${formData.last_name || ''}` : 'Création d\'un nouvel utilisateur'}
                </p>
              </div>
            </div>
          </div>
          <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>
      </div>

      {/* ============================================================
          FORMULAIRE - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            
            {/* ============================================================
                GRILLE 2 COLONNES - FORMULAIRE
                ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ============================================================
                  COLONNE GAUCHE
                  ============================================================ */}
              <div className="space-y-6">
                
                {/* Section: Identité */}
                <div className="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-primary" /> Identité
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium">Prénom</label>
                        <input
                          type="text"
                          name="first_name"
                          className={`input input-bordered w-full ${errors.first_name ? 'input-error' : ''}`}
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Prénom"
                        />
                        {errors.first_name && (
                          <span className="text-error text-xs mt-1">{errors.first_name}</span>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium">Nom</label>
                        <input
                          type="text"
                          name="last_name"
                          className={`input input-bordered w-full ${errors.last_name ? 'input-error' : ''}`}
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Nom"
                        />
                        {errors.last_name && (
                          <span className="text-error text-xs mt-1">{errors.last_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium">Nom d'utilisateur (username)</label>
                      <input
                        type="text"
                        name="username"
                        className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Nom d'utilisateur"
                      />
                      {errors.username && (
                        <span className="text-error text-xs mt-1">{errors.username}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Contact */}
                <div className="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-primary" /> Contact
                  </h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label text-sm font-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemple.com"
                        required
                      />
                      {errors.email && (
                        <span className="text-error text-xs mt-1">{errors.email}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-sm font-medium">Téléphone</label>
                        <input
                          type="text"
                          name="phone_number"
                          className={`input input-bordered w-full ${errors.phone_number ? 'input-error' : ''}`}
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="+225 01 23 45 67 89"
                        />
                        {errors.phone_number && (
                          <span className="text-error text-xs mt-1">{errors.phone_number}</span>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label text-sm font-medium">Date de naissance</label>
                        <input
                          type="date"
                          name="birthday"
                          className={`input input-bordered w-full ${errors.birthday ? 'input-error' : ''}`}
                          value={formData.birthday}
                          onChange={handleChange}
                        />
                        {errors.birthday && (
                          <span className="text-error text-xs mt-1">{errors.birthday}</span>
                        )}
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium">Adresse</label>
                      <input
                        type="text"
                        name="address"
                        className={`input input-bordered w-full ${errors.address ? 'input-error' : ''}`}
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Adresse complète"
                      />
                      {errors.address && (
                        <span className="text-error text-xs mt-1">{errors.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  COLONNE DROITE
                  ============================================================ */}
              <div className="space-y-6">
                
                {/* Section: Rôle */}
                <div className="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-primary" /> Rôle
                  </h3>
                  
                  <div className="form-control mb-4">
                    <label className="label text-sm font-medium">Sélectionner un rôle</label>
                    <select
                      name="role"
                      className={`select select-bordered w-full ${errors.role ? 'select-error' : ''}`}
                      value={formData.role}
                      onChange={handleChange}
                    >
                      {roleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.role && (
                      <span className="text-error text-xs mt-1">{errors.role}</span>
                    )}
                  </div>

                  {/* Aperçu du rôle sélectionné */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${roleInfo.bg} border border-gray-200`}>
                    <div className={`p-2 rounded-full ${roleInfo.bg}`}>
                      <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{roleInfo.label}</p>
                      <p className="text-xs text-gray-500">
                        {selectedRole === 'super_admin' && 'Accès total à toutes les fonctionnalités'}
                        {selectedRole === 'direction' && 'Gestion de l\'établissement et des finances'}
                        {selectedRole === 'administratif' && 'Gestion administrative et des dossiers'}
                        {selectedRole === 'enseignant' && 'Gestion des cours et des notes'}
                        {selectedRole === 'eleve' && 'Accès à l\'espace élève'}
                        {selectedRole === 'vie_scolaire' && 'Gestion de la vie scolaire'}
                        {selectedRole === 'alumni' && 'Accès à l\'espace ancien élève'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Statut */}
                <div className="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <BadgeCheck className="w-4 h-4 text-primary" /> Statut
                  </h3>
                  <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_active"
                        className="toggle toggle-success toggle-lg"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="text-sm font-medium">
                          {formData.is_active ? 'Compte actif' : 'Compte inactif'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {formData.is_active 
                            ? 'L\'utilisateur peut se connecter' 
                            : 'L\'utilisateur ne peut pas se connecter'}
                        </p>
                      </div>
                    </label>
                    {formData.is_active ? (
                      <BadgeCheck className="w-6 h-6 text-success ml-auto" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-error ml-auto" />
                    )}
                  </div>
                </div>

                {/* Section: Mot de passe */}
                <div className="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-primary" /> 
                    {isEditing ? 'Modifier le mot de passe' : 'Mot de passe'}
                  </h3>
                  {isEditing && (
                    <p className="text-xs text-gray-400 mb-3">Laisser vide pour ne pas changer le mot de passe</p>
                  )}
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label text-sm font-medium">Mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder={isEditing ? 'Nouveau mot de passe' : 'Mot de passe'}
                          required={!isEditing}
                          minLength={8}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-error text-xs mt-1">{errors.password}</span>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label text-sm font-medium">Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password_confirm"
                          className={`input input-bordered w-full ${errors.password_confirm ? 'input-error' : ''}`}
                          value={formData.password_confirm}
                          onChange={handleChange}
                          placeholder="Confirmer le mot de passe"
                          required={!isEditing}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password_confirm && (
                        <span className="text-error text-xs mt-1">{errors.password_confirm}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded-lg">
                        <Key className="w-3 h-3 inline mr-1" />
                        Le mot de passe doit contenir au moins 8 caractères.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================
                BOUTONS D'ACTION - PLEINE LARGEUR
                ============================================================ */}
            <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/utilisateurs')}
                className="btn btn-ghost gap-2"
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 flex-1 sm:flex-none min-w-[200px]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

// ✅ Composant Info pour les notifications
const Info = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default UtilisateurForm;