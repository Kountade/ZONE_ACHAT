// src/components/gestion/GestionNiveaux.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Layers, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  ChevronDown, ChevronUp, Award, Calendar,
  BookOpen, FolderTree, Home, Tag,
  MoreVertical  // Pour le menu dropdown
} from 'lucide-react';

const GestionNiveaux = () => {
  const navigate = useNavigate();
  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [anneeFilter, setAnneeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [niveauToDelete, setNiveauToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Récupération des données
  const fetchData = async () => {
    setLoading(true);
    try {
      const [niveauxRes, anneesRes] = await Promise.all([
        axiosInstance.get('/niveaux/'),
        axiosInstance.get('/annees-scolaires/')
      ]);
      setNiveaux(niveauxRes.data || []);
      setAnnees(anneesRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des niveaux', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!niveauToDelete) return;
    try {
      await axiosInstance.delete(`/niveaux/${niveauToDelete.id}/`);
      showNotification('Niveau supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setNiveauToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Filtrer et paginer
  const filteredNiveaux = niveaux.filter(n => {
    const matchSearch = !searchTerm ||
      (n.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (n.cycle?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchCycle = cycleFilter === 'all' || n.cycle === cycleFilter;
    const matchAnnee = anneeFilter === 'all' || n.annee_scolaire === anneeFilter;
    return matchSearch && matchCycle && matchAnnee;
  });

  const totalPages = Math.ceil(filteredNiveaux.length / itemsPerPage);
  const paginatedNiveaux = filteredNiveaux.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: niveaux.length,
    byCycle: {
      primaire: niveaux.filter(n => n.cycle === 'primaire').length,
      college: niveaux.filter(n => n.cycle === 'college').length,
      lycee: niveaux.filter(n => n.cycle === 'lycee').length,
      sup: niveaux.filter(n => n.cycle === 'sup').length,
    }
  };

  const getCycleLabel = (cycle) => {
    const map = {
      primaire: 'Primaire',
      college: 'Collège',
      lycee: 'Lycée',
      sup: 'Supérieur'
    };
    return map[cycle] || cycle;
  };

  const getCycleBadge = (cycle) => {
    const map = {
      primaire: 'badge-primary',
      college: 'badge-secondary',
      lycee: 'badge-accent',
      sup: 'badge-info'
    };
    return map[cycle] || 'badge-ghost';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des niveaux...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* Notification Toast */}
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

      {/* Modal Suppression */}
      {showDeleteModal && niveauToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce niveau ?</p>
              <p className="font-semibold text-error mt-2">{niveauToDelete.nom}</p>
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

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Layers className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Niveaux</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les niveaux scolaires – {stats.total} niveau(x)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/niveaux/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" />
              Nouveau niveau
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Total</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p></div>
              <Layers className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Primaire</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.byCycle.primaire}</p></div>
              <BookOpen className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Collège</p><p className="text-xl sm:text-2xl font-bold text-secondary">{stats.byCycle.college}</p></div>
              <Home className="w-8 h-8 text-secondary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Lycée</p><p className="text-xl sm:text-2xl font-bold text-accent">{stats.byCycle.lycee}</p></div>
              <Award className="w-8 h-8 text-accent/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Supérieur</p><p className="text-xl sm:text-2xl font-bold text-info">{stats.byCycle.sup}</p></div>
              <Tag className="w-8 h-8 text-info/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou cycle..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={cycleFilter} onChange={(e) => { setCycleFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les cycles</option>
              <option value="primaire">Primaire</option>
              <option value="college">Collège</option>
              <option value="lycee">Lycée</option>
              <option value="sup">Supérieur</option>
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={anneeFilter} onChange={(e) => { setAnneeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les années</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setCycleFilter('all'); setAnneeFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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

      {/* Tableau / Grille */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                  <th className="py-4 font-semibold">Nom</th>
                  <th className="py-4 font-semibold">Cycle</th>
                  <th className="py-4 font-semibold text-center">Ordre</th>
                  <th className="py-4 font-semibold">Année scolaire</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNiveaux.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <Layers className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun niveau trouvé</p>
                        <button onClick={() => navigate('/niveaux/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <Plus className="w-4 h-4" /> Ajouter un niveau
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedNiveaux.map(n => (
                    <tr key={n.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{n.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getCycleBadge(n.cycle)}`}>
                          {getCycleLabel(n.cycle)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{n.ordre}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{n.annee_scolaire}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/niveaux/${n.id}`)} className="btn btn-ghost btn-sm btn-circle" title="Détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/niveaux/${n.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setNiveauToDelete(n); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error" title="Supprimer">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paginatedNiveaux.map(n => (
              <div key={n.id} className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{n.nom}</h3>
                        <span className={`badge ${getCycleBadge(n.cycle)} text-xs`}>
                          {getCycleLabel(n.cycle)}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown dropdown-end">
                      <button className="btn btn-ghost btn-sm btn-circle">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <button onClick={() => navigate(`/niveaux/${n.id}`)} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> Voir détails
                          </button>
                        </li>
                        <li>
                          <button onClick={() => navigate(`/niveaux/${n.id}/modifier`)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Modifier
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { setNiveauToDelete(n); setShowDeleteModal(true); }} className="flex items-center gap-2 text-error">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Année : {n.annee_scolaire}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold">Ordre :</span>
                    <span className="badge badge-ghost">{n.ordre}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredNiveaux.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredNiveaux.length)}</span>{' '}
                sur <span className="font-semibold">{filteredNiveaux.length}</span> niveaux
              </div>
              <div className="flex items-center gap-3">
                <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="15">15 lignes</option>
                  <option value="20">20 lignes</option>
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

export default GestionNiveaux;