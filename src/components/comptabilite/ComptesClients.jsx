// src/components/comptabilite/ComptesClients.jsx
// Gestion des comptes clients - Liste, filtres, recherche et actions

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Users, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  User, MoreVertical, FileText, Download, Printer, Loader2,
  CreditCard, Wallet, DollarSign, TrendingUp,
  UserCheck, Building2, Home, AlertTriangle,
  Phone, Mail, MapPin, Calendar, Clock,
  Wifi, WifiOff
} from 'lucide-react';

const ComptesClients = () => {
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [situationFilter, setSituationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [compteToDelete, setCompteToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Récupérer les comptes clients
      const comptesRes = await axiosInstance.get('/comptes-clients/', headers);
      
      let comptesData = [];
      if (Array.isArray(comptesRes.data)) {
        comptesData = comptesRes.data;
      } else if (comptesRes.data?.results) {
        comptesData = comptesRes.data.results;
      } else if (typeof comptesRes.data === 'object') {
        comptesData = Object.values(comptesRes.data).filter(item => item?.id);
      }
      
      setComptes(comptesData);

      // Récupérer les statistiques
      try {
        const statsRes = await axiosInstance.get('/dashboard-financier/', headers);
        setStats(statsRes.data);
      } catch (statsError) {
        console.warn('⚠️ Impossible de charger les statistiques:', statsError);
        setStats(null);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setComptes([]);
        showNotification('Aucun compte client trouvé', 'info');
      } else {
        showNotification('Erreur de chargement des comptes clients', 'error');
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
    if (!compteToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/comptes-clients/${compteToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Compte client supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setCompteToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des transactions sont associées', 'error');
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
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
  };

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

  const getTypeClientLabel = (type) => {
    const map = {
      eleve: 'Élève',
      parent: 'Parent',
      tuteur: 'Tuteur',
      entreprise: 'Entreprise',
      autre: 'Autre'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeClientColor = (type) => {
    const map = {
      eleve: 'badge-primary',
      parent: 'badge-info',
      tuteur: 'badge-warning',
      entreprise: 'badge-secondary',
      autre: 'badge-ghost'
    };
    return map[type] || 'badge-ghost';
  };

  const getSituationBadge = (situation) => {
    const map = {
      normal: 'badge-success',
      retard: 'badge-error',
      exclusion: 'badge-error',
      suspendu: 'badge-warning',
      transfert: 'badge-info'
    };
    return map[situation] || 'badge-ghost';
  };

  const getSituationLabel = (situation) => {
    const map = {
      normal: 'Normal',
      retard: 'En retard',
      exclusion: 'Exclusion',
      suspendu: 'Suspendu',
      transfert: 'Transféré'
    };
    return map[situation] || situation || 'Inconnu';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredComptes = comptes.filter(c => {
    const matchSearch = !searchTerm ||
      (c.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.matricule?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.telephone || '').includes(searchTerm);

    const matchType = typeFilter === 'all' || c.type_client === typeFilter;
    const matchSituation = situationFilter === 'all' || c.situation === situationFilter;

    return matchSearch && matchType && matchSituation;
  });

  const totalPages = Math.ceil(filteredComptes.length / itemsPerPage) || 1;
  const paginatedComptes = filteredComptes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, situationFilter]);

  // Statistiques
  const totalSolde = comptes.reduce((sum, c) => sum + parseFloat(c.solde || 0), 0);
  const totalDu = comptes.reduce((sum, c) => sum + parseFloat(c.montant_total_dû || 0), 0);
  const totalPaye = comptes.reduce((sum, c) => sum + parseFloat(c.montant_total_paye || 0), 0);
  const tauxRecouvrement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des comptes clients...
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
      {showDeleteModal && compteToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce compte client ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{compteToDelete.prenom} {compteToDelete.nom}</p>
              <p className="text-sm text-gray-500">{compteToDelete.matricule}</p>
              {parseFloat(compteToDelete.solde || 0) > 0 && (
                <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> 
                  Solde de {formatCurrency(compteToDelete.solde)}
                </p>
              )}
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Comptes Clients</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les comptes clients – {comptes.length} compte(s)
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
              onClick={() => navigate('/comptes-clients/nouveau')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau compte
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{comptes.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total dû</p>
                <p className="text-xl sm:text-2xl font-bold text-error">{formatCurrency(totalDu)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total payé</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{formatCurrency(totalPaye)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Solde total</p>
                <p className={`text-xl sm:text-2xl font-bold ${totalSolde > 0 ? 'text-error' : 'text-success'}`}>
                  {formatCurrency(totalSolde)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Taux recouvrement</p>
                <p className={`text-xl sm:text-2xl font-bold ${tauxRecouvrement > 80 ? 'text-success' : tauxRecouvrement > 50 ? 'text-warning' : 'text-error'}`}>
                  {tauxRecouvrement}%
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${tauxRecouvrement > 80 ? 'text-success/20' : 'text-warning/20'}`} />
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
              placeholder="Rechercher par nom, prénom, matricule, email ou téléphone..."
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
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); }}
            >
              <option value="all">Tous les types</option>
              <option value="eleve">Élève</option>
              <option value="parent">Parent</option>
              <option value="tuteur">Tuteur</option>
              <option value="entreprise">Entreprise</option>
              <option value="autre">Autre</option>
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={situationFilter} 
              onChange={(e) => { setSituationFilter(e.target.value); }}
            >
              <option value="all">Toutes les situations</option>
              <option value="normal">Normal</option>
              <option value="retard">En retard</option>
              <option value="exclusion">Exclusion</option>
              <option value="suspendu">Suspendu</option>
              <option value="transfert">Transféré</option>
            </select>
            
            <button 
              className="btn btn-outline gap-2 hover:bg-primary/10 transition-all" 
              onClick={() => { 
                setTypeFilter('all');
                setSituationFilter('all');
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
                <th className="py-4 font-semibold">Client</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Matricule</th>
                <th className="py-4 font-semibold hidden md:table-cell">Type</th>
                <th className="py-4 font-semibold hidden lg:table-cell">Contact</th>
                <th className="py-4 font-semibold text-right">Total dû</th>
                <th className="py-4 font-semibold text-right">Solde</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Situation</th>
                <th className="py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComptes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || typeFilter !== 'all' || situationFilter !== 'all'
                          ? 'Aucun compte ne correspond aux filtres'
                          : 'Aucun compte client trouvé'}
                      </p>
                      <button 
                        onClick={() => navigate('/comptes-clients/nouveau')} 
                        className="btn btn-primary btn-sm gap-2 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter un compte
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComptes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p 
                            className="font-semibold hover:text-primary cursor-pointer transition-colors"
                            onClick={() => navigate(`/comptes-clients/${c.id}`)}
                          >
                            {c.prenom} {c.nom}
                          </p>
                          <p className="text-xs text-gray-400">{c.email || 'Pas d\'email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{c.matricule}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${getTypeClientColor(c.type_client)} badge-sm`}>
                        {getTypeClientLabel(c.type_client)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {c.telephone || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-700">{formatCurrency(c.montant_total_dû)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${parseFloat(c.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
                        {formatCurrency(c.solde)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge ${getSituationBadge(c.situation)}`}>
                        {getSituationLabel(c.situation)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/comptes-clients/${c.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip" 
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/comptes-clients/${c.id}/modifier`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip" 
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/comptes-clients/${c.id}/transactions`)} 
                          className="btn btn-ghost btn-sm btn-circle tooltip text-info" 
                          title="Transactions"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setCompteToDelete(c); setShowDeleteModal(true); }} 
                          className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredComptes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredComptes.length)}</span>{' '}
                sur <span className="font-semibold">{filteredComptes.length}</span> comptes
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

export default ComptesClients;