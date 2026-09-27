// src/components/evaluations/EvaluationsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Calendar, User, MoreVertical, FileText,
  Clock, School, File, TrendingUp, BarChart3,
  ClipboardCheck, BookOpen, GraduationCap,
  Tag, Users, Loader2, Award, FileCheck
} from 'lucide-react';

// ============================================================
// ⭐ HELPER : Charge TOUTES les pages DRF
// ============================================================
const fetchAllPages = async (url, headers) => {
  let all = [];
  let next = url;
  let safety = 0;
  while (next && safety < 50) {
    const res = await axiosInstance.get(next, headers);
    if (Array.isArray(res.data)) {
      all = all.concat(res.data);
      next = null;
    } else if (res.data?.results) {
      all = all.concat(res.data.results);
      next = res.data.next;
    } else {
      next = null;
    }
    safety++;
  }
  return all;
};

const EvaluationsList = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [showStats, setShowStats] = useState(false);

  // ⭐ Rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const isEleve = userRole === 'eleve';
  const isProf = userRole === 'professeur' || userRole === 'enseignant';
  const canEdit = userRole === 'super_admin' || userRole === 'direction' || userRole === 'administratif';

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // RÉCUPÉRATION DU RÔLE
  // ============================================================
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('User') || 'null');
      setUserRole(user?.role || null);
    } catch {
      setUserRole(null);
    }
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }
      const headers = { headers: { Authorization: `Token ${token}` } };

      const [evalData, typeData] = await Promise.all([
        fetchAllPages('/evaluations/', headers),
        fetchAllPages('/types-evaluation/', headers).catch(() => [])
      ]);

      setEvaluations(evalData);
      setTypes(typeData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des évaluations', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!evaluationToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/evaluations/${evaluationToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Évaluation supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setEvaluationToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des données sont associées', 'error');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // STATISTIQUES (calculées côté front)
  // ============================================================
  const stats = {
    total: evaluations.length,
    prevues: evaluations.filter(e => e.statut === 'prevue').length,
    enCours: evaluations.filter(e => e.statut === 'en_cours').length,
    terminees: evaluations.filter(e => e.statut === 'terminee').length,
    annulees: evaluations.filter(e => e.statut === 'annulee').length,
    reportees: evaluations.filter(e => e.statut === 'reportee').length,
    publiees: evaluations.filter(e => e.e_publie || e.est_publie).length,
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredEvaluations = evaluations.filter(item => {
    if (!item) return false;
    const searchLower = searchTerm.toLowerCase().trim();
    const matchSearch = !searchTerm ||
      (item.titre?.toLowerCase() || '').includes(searchLower) ||
      (item.matiere_nom?.toLowerCase() || '').includes(searchLower) ||
      (item.niveau_nom?.toLowerCase() || '').includes(searchLower) ||
      (item.type_nom?.toLowerCase() || '').includes(searchLower);

    const matchStatut = statutFilter === 'all' || item.statut === statutFilter;
    const matchType = typeFilter === 'all' || item.type_evaluation === parseInt(typeFilter);
    const matchNiveau = niveauFilter === 'all' || item.niveau === parseInt(niveauFilter);

    return matchSearch && matchStatut && matchType && matchNiveau;
  });

  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage) || 1;
  const paginatedItems = filteredEvaluations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter, typeFilter, niveauFilter]);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      prevue: 'badge-info',
      en_cours: 'badge-warning',
      terminee: 'badge-success',
      annulee: 'badge-error',
      reportee: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      prevue: 'Prévue',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
      reportee: 'Reportée'
    };
    return map[statut] || statut;
  };

  const getTypeColor = (couleur) => {
    if (!couleur) return 'bg-gray-100 text-gray-700';
    return `bg-[${couleur}]/10`;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des évaluations...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">

      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && evaluationToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette évaluation ?</p>
              <p className="font-semibold text-error mt-2">{evaluationToDelete.titre}</p>
              <p className="text-sm text-gray-500 mt-1">
                {evaluationToDelete.matiere_nom} • {evaluationToDelete.niveau_nom}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
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
                <TrendingUp className="w-5 h-5 text-primary" /> Statistiques des évaluations
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStats(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat bg-primary/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Total</div>
                <div className="stat-value text-2xl font-bold text-primary">{stats.total}</div>
              </div>
              <div className="stat bg-warning/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">En cours</div>
                <div className="stat-value text-2xl font-bold text-warning">{stats.enCours}</div>
              </div>
              <div className="stat bg-success/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Terminées</div>
                <div className="stat-value text-2xl font-bold text-success">{stats.terminees}</div>
              </div>
              <div className="stat bg-info/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Publiées</div>
                <div className="stat-value text-2xl font-bold text-info">{stats.publiees}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Par statut</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm"><span>Prévues</span><span className="font-bold text-info">{stats.prevues}</span></div>
                  <div className="flex justify-between text-sm"><span>En cours</span><span className="font-bold text-warning">{stats.enCours}</span></div>
                  <div className="flex justify-between text-sm"><span>Terminées</span><span className="font-bold text-success">{stats.terminees}</span></div>
                  <div className="flex justify-between text-sm"><span>Annulées</span><span className="font-bold text-error">{stats.annulees}</span></div>
                  <div className="flex justify-between text-sm"><span>Reportées</span><span className="font-bold text-orange-500">{stats.reportees}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Par matière</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {(() => {
                    const parMatiere = {};
                    evaluations.forEach(e => {
                      if (e.matiere_nom) {
                        parMatiere[e.matiere_nom] = (parMatiere[e.matiere_nom] || 0) + 1;
                      }
                    });
                    const entries = Object.entries(parMatiere);
                    if (entries.length === 0) return <p className="text-sm text-gray-400 text-center">Aucune donnée</p>;
                    return entries.map(([matiere, count]) => (
                      <div key={matiere} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span className="truncate">{matiere}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    ));
                  })()}
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
                <ClipboardCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">
                {isEleve || isProf ? 'Mes Évaluations' : 'Évaluations'}
              </h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              {isEleve ? 'Consultez vos évaluations' : isProf ? 'Vos évaluations assignées' : 'Gérez les évaluations'} – {evaluations.length} au total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowStats(true)}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={fetchData}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            {canEdit && (
              <button
                onClick={() => navigate('/evaluations/nouveau')}
                className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvelle évaluation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Prévues</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-500">{stats.prevues}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">En cours</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{stats.enCours}</p>
              </div>
              <ActivityIcon className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Terminées</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.terminees}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Annulées</p>
                <p className="text-xl sm:text-2xl font-bold text-error">{stats.annulees}</p>
              </div>
              <X className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Reportées</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500">{stats.reportees}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500/20" />
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
              placeholder="Rechercher par titre, matière, niveau, type..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>

          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select
              className="select select-bordered w-full focus:border-primary"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="prevue">Prévue</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
              <option value="reportee">Reportée</option>
            </select>

            <select
              className="select select-bordered w-full focus:border-primary"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {types.map(type => (
                <option key={type.id} value={type.id}>{type.nom}</option>
              ))}
            </select>

            <select
              className="select select-bordered w-full focus:border-primary"
              value={niveauFilter}
              onChange={(e) => setNiveauFilter(e.target.value)}
            >
              <option value="all">Tous les niveaux</option>
              {[...new Set(evaluations.map(e => e.niveau).filter(Boolean))].map(nid => {
                const niveauNom = evaluations.find(e => e.niveau === nid)?.niveau_nom;
                return (
                  <option key={nid} value={nid}>{niveauNom || `Niveau ${nid}`}</option>
                );
              })}
            </select>

            <div className="flex gap-2">
              <button
                className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all"
                onClick={() => {
                  setStatutFilter('all');
                  setTypeFilter('all');
                  setNiveauFilter('all');
                  setSearchTerm('');
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button
                  onClick={() => setViewMode('list')}
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
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
                  <th className="py-4 font-semibold">
                    <div className="flex items-center gap-1"><FileText className="w-4 h-4" /> Titre</div>
                  </th>
                  <th className="py-4 font-semibold hidden sm:table-cell">
                    <div className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> Matière</div>
                  </th>
                  <th className="py-4 font-semibold hidden md:table-cell">
                    <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> Niveau</div>
                  </th>
                  <th className="py-4 font-semibold hidden lg:table-cell">
                    <div className="flex items-center gap-1"><Tag className="w-4 h-4" /> Type</div>
                  </th>
                  <th className="py-4 font-semibold">
                    <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Date</div>
                  </th>
                  <th className="py-4 font-semibold">Statut</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <ClipboardCheck className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          {searchTerm || statutFilter !== 'all' || typeFilter !== 'all' || niveauFilter !== 'all'
                            ? 'Aucune évaluation ne correspond aux filtres'
                            : 'Aucune évaluation trouvée'}
                        </p>
                        {canEdit && (
                          <button
                            onClick={() => navigate('/evaluations/nouveau')}
                            className="btn btn-primary btn-sm gap-2 mt-2"
                          >
                            <Plus className="w-4 h-4" /> Nouvelle évaluation
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p
                              className="font-semibold hover:text-primary cursor-pointer transition-colors"
                              onClick={() => navigate(`/evaluations/${item.id}`)}
                            >
                              {item.titre || 'Sans titre'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.periode_libelle || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm">{item.matiere_nom || '-'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm">{item.niveau_nom || '-'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {item.type_nom || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(item.date_evaluation)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatutBadge(item.statut)}`}>
                          {getStatutLabel(item.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/evaluations/${item.id}`)}
                            className="btn btn-ghost btn-sm btn-circle tooltip"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => navigate(`/evaluations/${item.id}/modifier`)}
                                className="btn btn-ghost btn-sm btn-circle tooltip"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEvaluationToDelete(item);
                                  setShowDeleteModal(true);
                                }}
                                className="btn btn-ghost btn-sm btn-circle text-error tooltip"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(canEdit || isProf) && (
                            <button
                              onClick={() => navigate(`/evaluations/${item.id}/notes`)}
                              className="btn btn-ghost btn-sm btn-circle text-success tooltip"
                              title="Gérer les notes"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          )}
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
            {paginatedItems.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <ClipboardCheck className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucune évaluation trouvée</p>
                  {canEdit && (
                    <button
                      onClick={() => navigate('/evaluations/nouveau')}
                      className="btn btn-primary btn-sm gap-2 mt-2"
                    >
                      <Plus className="w-4 h-4" /> Nouvelle évaluation
                    </button>
                  )}
                </div>
              </div>
            ) : (
              paginatedItems.map(item => (
                <div
                  key={item.id}
                  className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200 cursor-pointer hover:border-primary"
                  onClick={() => navigate(`/evaluations/${item.id}`)}
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate">
                            {item.titre || 'Sans titre'}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {item.matiere_nom || '-'}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="dropdown dropdown-end" onClick={(ev) => ev.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-circle">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-48">
                            <li>
                              <button onClick={() => navigate(`/evaluations/${item.id}`)} className="flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Détails
                              </button>
                            </li>
                            <li>
                              <button onClick={() => navigate(`/evaluations/${item.id}/modifier`)} className="flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Modifier
                              </button>
                            </li>
                            <li>
                              <button onClick={() => navigate(`/evaluations/${item.id}/notes`)} className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" /> Notes
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setEvaluationToDelete(item);
                                  setShowDeleteModal(true);
                                }}
                                className="flex items-center gap-2 text-error"
                              >
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-gray-400" />
                        <span className="text-xs truncate">{item.niveau_nom || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs truncate">{item.type_nom || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className={`badge ${getStatutBadge(item.statut)} badge-sm`}>
                        {getStatutLabel(item.statut)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date_evaluation)}
                      </div>
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
        {filteredEvaluations.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage - 1) * itemsPerPage) + 1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage * itemsPerPage, filteredEvaluations.length)}</span>{' '}
                sur <span className="font-semibold">{filteredEvaluations.length}</span> évaluation(s)
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
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
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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

// Petit composant pour éviter le warning "Activity n'existe pas"
const ActivityIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default EvaluationsList;