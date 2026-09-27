// src/components/comptabilite/PlanComptable.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, BookOpen, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Layers, Tag, Hash, FileText, Loader2,
  TrendingUp, Download, Printer, FileSpreadsheet,
  FolderTree, Wifi, WifiOff, Info
} from 'lucide-react';

const PlanComptable = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);

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

      const [plansRes, statsRes] = await Promise.all([
        axiosInstance.get('/plan-comptable/', headers),
        axiosInstance.get('/plan-comptable/statistiques/', headers).catch(() => ({}))
      ]);

      let data = [];
      if (Array.isArray(plansRes.data)) {
        data = plansRes.data;
      } else if (plansRes.data?.results) {
        data = plansRes.data.results;
      }
      
      setPlans(data);
      setStats(statsRes.data || null);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement du plan comptable', 'error');
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
    if (!planToDelete) return;
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/plan-comptable/${planToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Plan comptable supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des transactions sont associées', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get('/plan-comptable/export_csv/', {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plan_comptable.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Export CSV effectué avec succès', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showNotification('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getCategorieLabel = (categorie) => {
    const map = {
      actif: 'Actif',
      passif: 'Passif',
      charge: 'Charge',
      produit: 'Produit'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  const getCategorieColor = (categorie) => {
    const map = {
      actif: 'badge-success',
      passif: 'badge-warning',
      charge: 'badge-error',
      produit: 'badge-info'
    };
    return map[categorie] || 'badge-ghost';
  };

  const getTypeLabel = (type) => {
    const map = {
      inscription: 'Frais d\'inscription',
      mensualite: 'Mensualité',
      scolarite: 'Scolarité',
      transport: 'Transport',
      cantine: 'Cantine',
      bibliotheque: 'Bibliothèque',
      activite: 'Activité parascolaire',
      salaire: 'Salaire',
      fourniture: 'Fourniture',
      entretien: 'Entretien',
      equipement: 'Équipement',
      taxe: 'Taxe',
      assurance: 'Assurance',
      autre: 'Autre'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeColor = (type) => {
    const map = {
      inscription: 'badge-primary',
      mensualite: 'badge-secondary',
      scolarite: 'badge-info',
      transport: 'badge-warning',
      cantine: 'badge-success',
      bibliotheque: 'badge-ghost',
      activite: 'badge-accent',
      salaire: 'badge-error',
      fourniture: 'badge-ghost',
      entretien: 'badge-ghost',
      equipement: 'badge-ghost',
      taxe: 'badge-ghost',
      assurance: 'badge-ghost',
      autre: 'badge-ghost'
    };
    return map[type] || 'badge-ghost';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredPlans = plans.filter(p => {
    const matchSearch = !searchTerm ||
      (p.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchCategorie = categorieFilter === 'all' || p.categorie === categorieFilter;
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchStatut = statutFilter === 'all' || 
      (statutFilter === 'actif' && p.est_actif === true) ||
      (statutFilter === 'inactif' && p.est_actif === false);

    return matchSearch && matchCategorie && matchType && matchStatut;
  });

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categorieFilter, typeFilter, statutFilter]);

  // Statistiques
  const totalActifs = plans.filter(p => p.est_actif).length;
  const totalInactifs = plans.filter(p => !p.est_actif).length;
  const categoriesStats = plans.reduce((acc, p) => {
    acc[p.categorie] = (acc[p.categorie] || 0) + 1;
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
            Chargement du plan comptable...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      
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
      {showDeleteModal && planToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce compte ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{planToDelete.code} - {planToDelete.nom}</p>
              <p className="text-sm text-gray-500">{planToDelete.categorie || 'Sans catégorie'}</p>
              {!planToDelete.est_actif && (
                <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Ce compte est déjà inactif
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL STATISTIQUES
          ============================================================ */}
      {showStats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Statistiques du plan comptable
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStats(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat bg-primary/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Total comptes</div>
                <div className="stat-value text-2xl font-bold text-primary">{plans.length}</div>
              </div>
              <div className="stat bg-success/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Actifs</div>
                <div className="stat-value text-2xl font-bold text-success">{totalActifs}</div>
              </div>
              <div className="stat bg-error/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Inactifs</div>
                <div className="stat-value text-2xl font-bold text-error">{totalInactifs}</div>
              </div>
              <div className="stat bg-info/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Catégories</div>
                <div className="stat-value text-2xl font-bold text-info">{Object.keys(categoriesStats).length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Par catégorie</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {Object.entries(categoriesStats).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">Aucune donnée</p>
                  ) : (
                    Object.entries(categoriesStats).map(([categorie, count]) => (
                      <div key={categorie} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span>{getCategorieLabel(categorie)}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Types de comptes</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {plans.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">Aucune donnée</p>
                  ) : (
                    [...new Set(plans.map(p => p.type))].slice(0, 10).map(type => (
                      <div key={type} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span>{getTypeLabel(type)}</span>
                        <span className="font-bold text-primary">{plans.filter(p => p.type === type).length}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowStats(false)}>Fermer</button>
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
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Plan Comptable</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez le plan comptable – {plans.length} compte(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button onClick={() => setShowStats(true)} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <TrendingUp className="w-4 h-4" /> Stats
            </button>
            <button onClick={handleExportCSV} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all" disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              CSV
            </button>
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/plan-comptable/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" /> Nouveau compte
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{plans.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary/20" />
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
              <CheckCircle className="w-8 h-8 text-success/20" />
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
              <X className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Catégories</p>
                <p className="text-xl sm:text-2xl font-bold text-info">{Object.keys(categoriesStats).length}</p>
              </div>
              <Layers className="w-8 h-8 text-info/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Taux actif</p>
                <p className={`text-xl sm:text-2xl font-bold ${plans.length > 0 && totalActifs / plans.length > 0.8 ? 'text-success' : 'text-warning'}`}>
                  {plans.length > 0 ? Math.round((totalActifs / plans.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${plans.length > 0 && totalActifs / plans.length > 0.8 ? 'text-success/20' : 'text-warning/20'}`} />
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
              placeholder="Rechercher par code, nom ou description..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={categorieFilter} 
              onChange={(e) => { setCategorieFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes les catégories</option>
              <option value="actif">Actif</option>
              <option value="passif">Passif</option>
              <option value="charge">Charge</option>
              <option value="produit">Produit</option>
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les types</option>
              <option value="inscription">Frais d'inscription</option>
              <option value="mensualite">Mensualité</option>
              <option value="scolarite">Scolarité</option>
              <option value="transport">Transport</option>
              <option value="cantine">Cantine</option>
              <option value="bibliotheque">Bibliothèque</option>
              <option value="activite">Activité parascolaire</option>
              <option value="salaire">Salaire</option>
              <option value="fourniture">Fourniture</option>
              <option value="entretien">Entretien</option>
              <option value="equipement">Équipement</option>
              <option value="taxe">Taxe</option>
              <option value="assurance">Assurance</option>
              <option value="autre">Autre</option>
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={statutFilter} 
              onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
            
            <div className="flex gap-2">
              <button 
                className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" 
                onClick={() => { 
                  setCategorieFilter('all');
                  setTypeFilter('all');
                  setStatutFilter('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button onClick={() => setViewMode('list')} className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('grid')} className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          TABLEAU / GRILLE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                  <th className="py-4 font-semibold">Code</th>
                  <th className="py-4 font-semibold">Nom</th>
                  <th className="py-4 font-semibold hidden md:table-cell">Catégorie</th>
                  <th className="py-4 font-semibold hidden lg:table-cell">Type</th>
                  <th className="py-4 font-semibold hidden sm:table-cell">Description</th>
                  <th className="py-4 font-semibold text-center">Statut</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          {searchTerm || categorieFilter !== 'all' || typeFilter !== 'all' || statutFilter !== 'all'
                            ? 'Aucun compte ne correspond aux filtres'
                            : 'Aucun compte comptable trouvé'}
                        </p>
                        <button onClick={() => navigate('/plan-comptable/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <Plus className="w-4 h-4" /> Ajouter un compte
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-primary">{p.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{p.nom}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`badge ${getCategorieColor(p.categorie)}`}>
                          {getCategorieLabel(p.categorie)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`badge ${getTypeColor(p.type)} badge-sm`}>
                          {getTypeLabel(p.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
                          {p.description || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${p.est_actif ? 'badge-success' : 'badge-error'} gap-1`}>
                          {p.est_actif ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {p.est_actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/plan-comptable/${p.id}`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/plan-comptable/${p.id}/modifier`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setPlanToDelete(p); setShowDeleteModal(true); }} 
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
        ) : (
          // ============================================================
          // VUE GRILLE
          // ============================================================
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paginatedPlans.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucun compte trouvé</p>
                  <button onClick={() => navigate('/plan-comptable/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                    <Plus className="w-4 h-4" /> Ajouter un compte
                  </button>
                </div>
              </div>
            ) : (
              paginatedPlans.map(p => (
                <div 
                  key={p.id} 
                  className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200 cursor-pointer hover:border-primary"
                  onClick={() => navigate(`/plan-comptable/${p.id}`)}
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-primary text-sm">{p.code}</p>
                        <h3 className="font-semibold text-sm hover:text-primary transition-colors mt-1">
                          {p.nom}
                        </h3>
                      </div>
                      <div className="dropdown dropdown-end" onClick={(ev) => ev.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm btn-circle">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-48">
                          <li>
                            <button onClick={() => navigate(`/plan-comptable/${p.id}`)} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Détails
                            </button>
                          </li>
                          <li>
                            <button onClick={() => navigate(`/plan-comptable/${p.id}/modifier`)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                          </li>
                          <li>
                            <button onClick={() => { setPlanToDelete(p); setShowDeleteModal(true); }} className="flex items-center gap-2 text-error">
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className={`badge ${getCategorieColor(p.categorie)} badge-xs`}>
                        {getCategorieLabel(p.categorie)}
                      </span>
                      <span className={`badge ${getTypeColor(p.type)} badge-xs`}>
                        {getTypeLabel(p.type)}
                      </span>
                    </div>

                    {p.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{p.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className={`badge ${p.est_actif ? 'badge-success' : 'badge-error'} badge-xs gap-1`}>
                        {p.est_actif ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {p.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                      {p.parent && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FolderTree className="w-3 h-3" /> Parent: {p.parent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredPlans.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredPlans.length)}</span>{' '}
                sur <span className="font-semibold">{filteredPlans.length}</span> comptes
              </div>
              <div className="flex items-center gap-3">
                <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="join">
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>
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

// Composant MoreVertical pour le menu dropdown
const MoreVertical = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export default PlanComptable;