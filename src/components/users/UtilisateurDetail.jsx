// src/components/users/UtilisateurDetail.jsx
// Détails d'un utilisateur - Pleine largeur

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin,
  Calendar, Clock, Shield, UserCog, UserCheck,
  AlertCircle, CheckCircle, Loader2, X,
  Wifi, WifiOff, BadgeCheck, Users,
  RefreshCw, Eye, Lock, Key,
  Building2, Home, Calendar as CalendarIcon,
  MoreVertical, UserPlus, UserX,
  AlertTriangle, Award, BookOpen, Globe, Link,
  Smartphone, AtSign, Hash, CreditCard, DollarSign
} from 'lucide-react';

const UtilisateurDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

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

      // Charger l'utilisateur
      const userRes = await axiosInstance.get(`/users/${id}/`, headers);
      setUser(userRes.data);
      setPermissions(userRes.data.permissions || []);

      // Charger l'utilisateur connecté
      try {
        const meRes = await axiosInstance.get('/users/me/', headers);
        setCurrentUser(meRes.data);
      } catch (meError) {
        console.warn('⚠️ Impossible de charger le profil:', meError);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Utilisateur non trouvé');
      } else if (error.response?.status === 403) {
        setError('Vous n\'avez pas la permission de voir cet utilisateur');
      } else {
        setError('Erreur lors du chargement');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      setError('ID d\'utilisateur manquant');
      setLoading(false);
    }
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/users/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Utilisateur supprimé avec succès', 'success');
      setTimeout(() => navigate('/utilisateurs'), 1500);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer cet utilisateur', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
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

  const getStatusBadge = (isActive) => {
    return isActive ? 'badge-success' : 'badge-error';
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Actif' : 'Inactif';
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
            Chargement de l'utilisateur...
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
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/utilisateurs')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={fetchData} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/utilisateurs')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);
  const isCurrentUser = currentUser?.id === user.id;

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
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cet utilisateur ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
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
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <RoleIcon className="w-7 h-7 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                  {user.first_name} {user.last_name}
                  {isCurrentUser && (
                    <span className="badge badge-primary badge-sm">Vous</span>
                  )}
                  {user.is_superuser && (
                    <Shield className="w-5 h-5 text-error" />
                  )}
                  {user.is_active && (
                    <BadgeCheck className="w-5 h-5 text-success" />
                  )}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span>{user.email}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className={`badge ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            {user.is_online && (
              <div className="badge badge-success gap-1 px-2 py-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                En ligne
              </div>
            )}
            <button 
              onClick={() => navigate(`/utilisateurs/${id}/modifier`)} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            {!isCurrentUser && user.role !== 'super_admin' && (
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="btn btn-sm btn-error gap-2"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          CONTENU PRINCIPAL - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* ============================================================
            BADGES STATUT
            ============================================================ */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className={`badge ${getStatusBadge(user.is_active)} p-3 text-sm gap-1`}>
            {user.is_active ? <CheckCircle className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            {getStatusLabel(user.is_active)}
          </div>
          {user.is_staff && (
            <div className="badge badge-info p-3 text-sm gap-1">
              <UserCheck className="w-4 h-4" /> Personnel
            </div>
          )}
          {user.is_superuser && (
            <div className="badge badge-error p-3 text-sm gap-1">
              <Shield className="w-4 h-4" /> Super Admin
            </div>
          )}
          {user.date_joined && (
            <div className="badge badge-ghost p-3 text-sm gap-1">
              <Calendar className="w-4 h-4" /> Inscrit le {formatDate(user.date_joined)}
            </div>
          )}
        </div>

        {/* ============================================================
            GRILLE 2 COLONNES - GAUCHE / DROITE
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* ============================================================
              COLONNE GAUCHE
              ============================================================ */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Informations personnelles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" /> Informations personnelles
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Prénom</span>
                  <span className="font-medium">{user.first_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{user.last_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom d'utilisateur</span>
                  <span className="font-medium">{user.username || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date de naissance</span>
                  <span className="font-medium">{formatDate(user.birthday)}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-primary" /> Contact
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium truncate max-w-[200px]">{user.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{user.phone_number || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Adresse</span>
                  <span className="font-medium text-right max-w-[200px]">{user.address || '-'}</span>
                </div>
              </div>
            </div>

            {/* Rôle et permissions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" /> Rôle et permissions
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Rôle</span>
                  <span className={`badge ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Accès admin</span>
                  <span className={`badge ${user.is_staff ? 'badge-success' : 'badge-error'}`}>
                    {user.is_staff ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Permissions</span>
                  <span className="font-medium">{permissions.length} permission(s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              COLONNE DROITE
              ============================================================ */}
          <div className="space-y-4 sm:space-y-6">

            {/* Permissions détaillées */}
            {permissions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-primary" /> Liste des permissions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm, index) => (
                    <span key={index} className="badge badge-ghost badge-sm px-3 py-2 text-xs">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informations de compte */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" /> Informations de compte
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Inscrit le</span>
                  <span className="font-medium">{formatDateTime(user.date_joined)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Dernière connexion</span>
                  <span className="font-medium">{formatDateTime(user.last_login)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dernière IP</span>
                  <span className="font-medium font-mono">{user.last_login_ip || '-'}</span>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4 text-primary" /> Métadonnées
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Créé le</span>
                  <span className="font-medium">{formatDateTime(user.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Modifié le</span>
                  <span className="font-medium">{formatDateTime(user.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            AUDIT - PLEINE LARGEUR
            ============================================================ */}
        <div className="mt-4 sm:mt-6 text-xs text-gray-400 text-center py-2 border-t border-gray-200">
          Créé le {formatDateTime(user.created_at)} • 
          Modifié le {formatDateTime(user.updated_at)}
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

export default UtilisateurDetail;