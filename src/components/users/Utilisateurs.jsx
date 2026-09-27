// src/components/users/Utilisateurs.jsx
// Gestion des utilisateurs - Liste, filtres, recherche et actions

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Users, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, User, MoreVertical,
  Loader2, Shield, UserCog, UserCheck,
  Mail, Phone, Calendar, Clock,
  Wifi, WifiOff, UserPlus, BadgeCheck,
  AlertTriangle, Ban, UserX
} from 'lucide-react';

const Utilisateurs = () => {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // ✅ Correction ici
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // Récupérer les utilisateurs
      const usersRes = await axiosInstance.get('/users/', headers);
      
      let usersData = [];
      if (Array.isArray(usersRes.data)) {
        usersData = usersRes.data;
      } else if (usersRes.data?.results) {
        usersData = usersRes.data.results;
      } else if (typeof usersRes.data === 'object') {
        usersData = Object.values(usersRes.data).filter(item => item?.id);
      }
      
      setUtilisateurs(usersData);

      // Récupérer l'utilisateur connecté
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
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de voir les utilisateurs', 'error');
      } else if (error.response?.status === 404) {
        setUtilisateurs([]);
        showNotification('Aucun utilisateur trouvé', 'info');
      } else {
        showNotification('Erreur de chargement des utilisateurs', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!utilisateurToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/users/${utilisateurToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Utilisateur supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setUtilisateurToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer cet utilisateur', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
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

  const getRoleLabel = (role) => {
    const map = {
      super_admin: 'Super Admin',
      direction: 'Direction',
      administratif: 'Administratif',
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
  // FILTRES
  // ============================================================
  const filteredUsers = utilisateurs.filter(u => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const matchSearch = !searchTerm ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'inactive' && !u.is_active);

    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Statistiques
  const totalActifs = utilisateurs.filter(u => u.is_active).length;
  const totalInactifs = utilisateurs.filter(u => !u.is_active).length;
  const rolesCount = utilisateurs.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des utilisateurs...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen w-full">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl text-sm sm:text-base rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle flex-shrink-0" 
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
      {showDeleteModal && utilisateurToDelete && (
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
              <p className="font-semibold text-error mt-2 text-lg">
                {utilisateurToDelete.first_name} {utilisateurToDelete.last_name}
              </p>
              <p className="text-sm text-gray-500">{utilisateurToDelete.email}</p>
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
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Utilisateurs</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les utilisateurs – {utilisateurs.length} utilisateur(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={fetchData} 
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/utilisateurs/nouveau')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{utilisateurs.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Actifs</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{totalActifs}</p>
              </div>
              <BadgeCheck className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Inactifs</p>
                <p className="text-xl sm:text-2xl font-bold text-error">{totalInactifs}</p>
              </div>
              <UserX className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Rôles</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{Object.keys(rolesCount).length}</p>
              </div>
              <Shield className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTRES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> 
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={roleFilter} 
              onChange={(e) => { setRoleFilter(e.target.value); }}
            >
              <option value="all">Tous les rôles</option>
              <option value="super_admin">Super Admin</option>
              <option value="direction">Direction</option>
              <option value="administratif">Administratif</option>
              <option value="enseignant">Enseignant</option>
              <option value="eleve">Élève</option>
              <option value="vie_scolaire">Vie Scolaire</option>
              <option value="alumni">Ancien Élève</option>
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            
            <button 
              className="btn btn-outline gap-2 hover:bg-primary/10 transition-all" 
              onClick={() => { 
                setRoleFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          TABLEAU
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                <th className="py-4 font-semibold">Utilisateur</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Rôle</th>
                <th className="py-4 font-semibold hidden md:table-cell">Email</th>
                <th className="py-4 font-semibold hidden lg:table-cell">Téléphone</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Statut</th>
                <th className="py-4 font-semibold hidden xl:table-cell">Inscrit le</th>
                <th className="py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'Aucun utilisateur ne correspond aux filtres'
                          : 'Aucun utilisateur trouvé'}
                      </p>
                      <button 
                        onClick={() => navigate('/utilisateurs/nouveau')} 
                        className="btn btn-primary btn-sm gap-2 mt-2"
                      >
                        <UserPlus className="w-4 h-4" /> Ajouter un utilisateur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(u => {
                  const RoleIcon = getRoleIcon(u.role);
                  const isCurrentUser = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {u.profile_picture ? (
                              <img src={u.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <RoleIcon className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {u.first_name} {u.last_name}
                              {isCurrentUser && (
                                <span className="badge badge-primary badge-xs">Vous</span>
                              )}
                              {u.is_superuser && (
                                <Shield className="w-4 h-4 text-error" />
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{u.username || u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge ${getRoleColor(u.role)} badge-sm`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {u.phone_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${getStatusBadge(u.is_active)} badge-sm`}>
                            {getStatusLabel(u.is_active)}
                          </span>
                          {u.is_online && (
                            <span className="badge badge-success badge-xs gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              En ligne
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm text-gray-500">
                        {formatDate(u.created_at || u.date_joined)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/utilisateurs/${u.id}`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/utilisateurs/${u.id}/modifier`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isCurrentUser && u.role !== 'super_admin' && (
                            <button 
                              onClick={() => { setUtilisateurToDelete(u); setShowDeleteModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredUsers.length)}</span>{' '}
                sur <span className="font-semibold">{filteredUsers.length}</span> utilisateurs
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="select select-bordered select-sm" 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="join">
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                    disabled={currentPage===1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button 
                        key={pageNum} 
                        onClick={() => setCurrentPage(pageNum)} 
                        className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                    disabled={currentPage===totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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

export default Utilisateurs;