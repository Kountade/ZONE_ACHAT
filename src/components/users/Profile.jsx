// src/components/users/Profile.jsx
// Profil utilisateur - Pleine largeur avec onglets

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  User, Mail, Phone, MapPin, Calendar, Lock,
  Shield, UserCog, UserCheck, AlertCircle,
  CheckCircle, Loader2, X, Edit, Save,
  Wifi, WifiOff, BadgeCheck, Users,
  RefreshCw, Eye, EyeOff, Key,
  Home, Smartphone, AtSign, Camera,
  Upload, Trash2, Image, Award,
  BookOpen, Clock, LogOut, Settings,
  ChevronRight, CreditCard, DollarSign
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('info');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Formulaire d'édition
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    phone_number: '',
    address: '',
    birthday: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Formulaire mot de passe
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Image de profil
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Statistiques
  const [stats, setStats] = useState({
    total_connections: 0,
    last_connection: null,
    total_actions: 0
  });

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
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // ✅ Récupérer le profil via /users/me/ (endpoint existant)
      const profileRes = await axiosInstance.get('/users/me/', headers);
      const userData = profileRes.data;
      
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || '',
        phone_number: userData.phone_number || '',
        address: userData.address || '',
        birthday: userData.birthday || '',
        email: userData.email || '',
      });
      setProfileImage(userData.profile_picture || null);

      // ✅ Charger les statistiques (optionnel - endpoint à adapter)
      try {
        // Si vous avez un endpoint de statistiques
        // const statsRes = await axiosInstance.get('/profile/stats/', headers);
        // setStats(statsRes.data);
        
        // Simuler des stats pour l'instant
        setStats({
          total_connections: 42,
          last_connection: userData.last_login,
          total_actions: 157
        });
      } catch (statsError) {
        console.warn('⚠️ Impossible de charger les statistiques:', statsError);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      
      // ✅ Gestion détaillée des erreurs
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        localStorage.removeItem('Token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError('Vous n\'avez pas la permission d\'accéder à ce profil');
        showNotification('Accès refusé', 'error');
      } else if (error.response?.status === 404) {
        setError('Profil non trouvé');
        showNotification('Profil non trouvé', 'error');
      } else if (error.response?.status === 500) {
        setError('Erreur serveur, veuillez réessayer plus tard');
        showNotification('Erreur serveur', 'error');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('La requête a expiré, vérifiez votre connexion');
        showNotification('Temps d\'attente dépassé', 'error');
      } else if (!error.response) {
        setError('Impossible de se connecter au serveur');
        showNotification('Erreur de connexion', 'error');
      } else {
        setError('Erreur lors du chargement du profil');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // ENREGISTREMENT DU PROFIL
  // ============================================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // ✅ Utiliser /users/me/ pour la mise à jour partielle
      const response = await axiosInstance.patch('/users/me/', formData, headers);
      setUser(response.data);
      setEditMode(false);
      showNotification('Profil mis à jour avec succès', 'success');

    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      if (error.response?.status === 400) {
        setFormErrors(error.response.data || {});
        showNotification('Veuillez corriger les erreurs', 'error');
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur lors de la mise à jour', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGEMENT DE MOT DE PASSE
  // ============================================================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordErrors({});

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordErrors({ new_password_confirm: 'Les mots de passe ne correspondent pas' });
      setChangingPassword(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordErrors({ new_password: 'Le mot de passe doit contenir au moins 8 caractères' });
      setChangingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // ✅ Utiliser l'endpoint de changement de mot de passe
      await axiosInstance.post('/profile/change_password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.new_password_confirm
      }, headers);

      showNotification('Mot de passe changé avec succès', 'success');
      setShowPasswordModal(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: ''
      });

    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      if (error.response?.status === 400) {
        setPasswordErrors(error.response.data || {});
        showNotification('Veuillez corriger les erreurs', 'error');
      } else if (error.response?.status === 401) {
        setPasswordErrors({ old_password: 'Ancien mot de passe incorrect' });
        showNotification('Ancien mot de passe incorrect', 'error');
      } else {
        showNotification('Erreur lors du changement', 'error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================================
  // UPLOAD DE L'IMAGE DE PROFIL
  // ============================================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('L\'image ne doit pas dépasser 2 Mo', 'error');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        showNotification('Format d\'image non supporté', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;
    setUploadingImage(true);

    try {
      const token = localStorage.getItem('Token');
      const formData = new FormData();
      formData.append('profile_picture', imageFile);

      // ✅ Utiliser /users/me/ pour l'upload
      const response = await axiosInstance.patch('/users/me/', formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(response.data);
      setProfileImage(response.data.profile_picture);
      setImageFile(null);
      setShowImageModal(false);
      showNotification('Photo de profil mise à jour', 'success');

    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      showNotification('Erreur lors de l\'upload', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const token = localStorage.getItem('Token');
      // ✅ Utiliser /users/me/ pour supprimer l'image
      await axiosInstance.patch('/users/me/', { profile_picture: null }, {
        headers: { Authorization: `Token ${token}` }
      });

      setUser(prev => ({ ...prev, profile_picture: null }));
      setProfileImage(null);
      setImageFile(null);
      setShowImageModal(false);
      showNotification('Photo de profil supprimée', 'success');

    } catch (error) {
      console.error('❌ Erreur suppression image:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // DÉCONNEXION
  // ============================================================
  const handleLogout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getRoleLabel = (role) => {
    const map = {
      super_admin: 'Super Administrateur',
      direction: 'Direction',
      administratif: 'Personnel Administratif',
      enseignant: 'Enseignant',
      eleve: 'Élève',
      vie_scolaire: 'Vie Scolaire',
      alumni: 'Ancien Élève'
    };
    return map[role] || role || 'Non défini';
  };

  const getRoleColor = (role) => {
    const map = {
      super_admin: 'badge-error',
      direction: 'badge-primary',
      administratif: 'badge-info',
      enseignant: 'badge-warning',
      eleve: 'badge-success',
      vie_scolaire: 'badge-secondary',
      alumni: 'badge-ghost'
    };
    return map[role] || 'badge-ghost';
  };

  const getRoleIcon = (role) => {
    const map = {
      super_admin: Shield,
      direction: UserCog,
      administratif: UserCheck,
      enseignant: User,
      eleve: User,
      vie_scolaire: Users,
      alumni: User
    };
    return map[role] || User;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4 animate-pulse">
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">{error}</h3>
          <p className="text-gray-500 text-sm mt-2">Veuillez réessayer.</p>
          <button 
            onClick={fetchData} 
            className="btn btn-primary gap-2 mt-6"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-ghost gap-2 mt-2 ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const RoleIcon = getRoleIcon(user.role);

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
          MODAL CHANGEMENT DE MOT DE PASSE
          ============================================================ */}
      {showPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" /> Changer le mot de passe
            </h3>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label text-sm font-medium">Ancien mot de passe</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      name="old_password"
                      className={`input input-bordered w-full ${passwordErrors.old_password ? 'input-error' : ''}`}
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      placeholder="Ancien mot de passe"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.old_password && (
                    <span className="text-error text-xs mt-1">{passwordErrors.old_password}</span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label text-sm font-medium">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      className={`input input-bordered w-full ${passwordErrors.new_password ? 'input-error' : ''}`}
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Nouveau mot de passe"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <span className="text-error text-xs mt-1">{passwordErrors.new_password}</span>
                  )}
                  <span className="text-xs text-gray-400 mt-1">Minimum 8 caractères</span>
                </div>
                <div className="form-control">
                  <label className="label text-sm font-medium">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPasswordConfirm ? 'text' : 'password'}
                      name="new_password_confirm"
                      className={`input input-bordered w-full ${passwordErrors.new_password_confirm ? 'input-error' : ''}`}
                      value={passwordData.new_password_confirm}
                      onChange={handlePasswordChange}
                      placeholder="Confirmer le mot de passe"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                    >
                      {showNewPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.new_password_confirm && (
                    <span className="text-error text-xs mt-1">{passwordErrors.new_password_confirm}</span>
                  )}
                </div>
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPasswordModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary gap-2" disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {changingPassword ? 'Changement...' : 'Changer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL UPLOAD IMAGE
          ============================================================ */}
      {showImageModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" /> Photo de profil
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-primary/20">
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                id="profileImageInput"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <label htmlFor="profileImageInput" className="btn btn-outline gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Choisir une image
              </label>
              {imageFile && (
                <p className="text-sm text-gray-500">{imageFile.name}</p>
              )}
              {profileImage && user.profile_picture && (
                <button 
                  type="button"
                  className="btn btn-error btn-sm gap-2"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              )}
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => {
                setShowImageModal(false);
                setImageFile(null);
                setProfileImage(user.profile_picture || null);
              }}>
                Annuler
              </button>
              <button 
                type="button" 
                className="btn btn-primary gap-2"
                onClick={handleUploadImage}
                disabled={!imageFile || uploadingImage}
              >
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {uploadingImage ? 'Upload...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Photo de profil */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <RoleIcon className="w-14 h-14 text-primary" />
                )}
              </div>
              <button 
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all"
                onClick={() => setShowImageModal(true)}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Informations utilisateur */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">
                  {user.first_name} {user.last_name}
                </h1>
                {user.is_active && (
                  <BadgeCheck className="w-6 h-6 text-success" />
                )}
                <span className={`badge ${getRoleColor(user.role)} text-sm px-3 py-2`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 text-xs`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setEditMode(!editMode)}
                className="btn btn-sm gap-2"
              >
                {editMode ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {editMode ? 'Annuler' : 'Modifier'}
              </button>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="btn btn-sm btn-outline gap-2"
              >
                <Lock className="w-4 h-4" /> Mot de passe
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-sm btn-error gap-2"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          CONTENU PRINCIPAL - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* ============================================================
            ONGLETS
            ============================================================ */}
        <div className="border-b border-gray-200 bg-white rounded-t-xl px-4">
          <div className="flex overflow-x-auto gap-1">
            {[
              { id: 'info', label: 'Informations', icon: User },
              { id: 'security', label: 'Sécurité', icon: Shield },
              { id: 'stats', label: 'Statistiques', icon: ChartBar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            CONTENU DES ONGLETS
            ============================================================ */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-4 sm:p-6">
          
          {/* ============================================================
              ONGLET INFORMATIONS
              ============================================================ */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label text-sm font-medium">Prénom</label>
                    <input
                      type="text"
                      name="first_name"
                      className={`input input-bordered w-full ${formErrors.first_name ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                    {formErrors.first_name && (
                      <span className="text-error text-xs mt-1">{formErrors.first_name}</span>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium">Nom</label>
                    <input
                      type="text"
                      name="last_name"
                      className={`input input-bordered w-full ${formErrors.last_name ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                    {formErrors.last_name && (
                      <span className="text-error text-xs mt-1">{formErrors.last_name}</span>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium">Nom d'utilisateur</label>
                    <input
                      type="text"
                      name="username"
                      className={`input input-bordered w-full ${formErrors.username ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                    {formErrors.username && (
                      <span className="text-error text-xs mt-1">{formErrors.username}</span>
                    )}
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label text-sm font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                      value={formData.email}
                      disabled
                    />
                    <span className="text-xs text-gray-400">L'email ne peut pas être modifié</span>
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium">Téléphone</label>
                    <input
                      type="text"
                      name="phone_number"
                      className={`input input-bordered w-full ${formErrors.phone_number ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.phone_number}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="+225 01 23 45 67 89"
                    />
                    {formErrors.phone_number && (
                      <span className="text-error text-xs mt-1">{formErrors.phone_number}</span>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium">Date de naissance</label>
                    <input
                      type="date"
                      name="birthday"
                      className={`input input-bordered w-full ${formErrors.birthday ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.birthday}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                    {formErrors.birthday && (
                      <span className="text-error text-xs mt-1">{formErrors.birthday}</span>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label text-sm font-medium">Adresse</label>
                    <input
                      type="text"
                      name="address"
                      className={`input input-bordered w-full ${formErrors.address ? 'input-error' : ''} ${!editMode ? 'bg-gray-50' : ''}`}
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Adresse complète"
                    />
                    {formErrors.address && (
                      <span className="text-error text-xs mt-1">{formErrors.address}</span>
                    )}
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        username: user.username || '',
                        phone_number: user.phone_number || '',
                        address: user.address || '',
                        birthday: user.birthday || '',
                        email: user.email || '',
                      });
                    }}
                    className="btn btn-ghost gap-2"
                  >
                    <X className="w-4 h-4" /> Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary gap-2 flex-1 sm:flex-none min-w-[150px]"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ============================================================
              ONGLET SÉCURITÉ
              ============================================================ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-primary" /> Mot de passe
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Modifiez votre mot de passe régulièrement pour sécuriser votre compte.
                </p>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-primary gap-2"
                >
                  <Lock className="w-4 h-4" /> Changer le mot de passe
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-primary" /> Sessions actives
                </h3>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Session actuelle</p>
                    <p className="text-xs text-gray-400">
                      Connecté depuis {formatDateTime(user.last_login)}
                    </p>
                  </div>
                  <div className="badge badge-success gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Active
                  </div>
                </div>
                {user.last_login_ip && (
                  <p className="text-xs text-gray-400 mt-2">
                    IP: {user.last_login_ip}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-primary" /> Rôle et permissions
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Rôle</span>
                    <span className={`badge ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Statut</span>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accès admin</span>
                    <span className={`badge ${user.is_staff ? 'badge-success' : 'badge-error'}`}>
                      {user.is_staff ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              ONGLET STATISTIQUES
              ============================================================ */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 uppercase">Dernière connexion</p>
                  <p className="text-sm font-semibold mt-1">{formatDateTime(user.last_login)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-success/10 rounded-full">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 uppercase">Statut</p>
                  <p className={`text-sm font-semibold mt-1 ${user.is_active ? 'text-success' : 'text-error'}`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-warning/10 rounded-full">
                      <Calendar className="w-5 h-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 uppercase">Membre depuis</p>
                  <p className="text-sm font-semibold mt-1">{formatDate(user.date_joined)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-primary" /> Activité
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Total connexions</span>
                    <span className="font-bold">{stats.total_connections || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Dernière connexion</span>
                    <span className="font-medium">{formatDateTime(stats.last_connection || user.last_login)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actions effectuées</span>
                    <span className="font-bold">{stats.total_actions || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-primary" /> Informations du compte
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">ID</span>
                    <span className="font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Rôle</span>
                    <span className={`badge ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Super Admin</span>
                    <span>{user.is_superuser ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Composant ChartBar pour les statistiques
const ChartBar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// ✅ Composant Info pour les notifications
const Info = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ✅ Import manquant pour ArrowLeft
const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default Profile;