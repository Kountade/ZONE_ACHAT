// src/components/gestion/GestionSalles.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  MoreVertical, Building2, DoorOpen, Users,
  Home, Tag, Calendar, BookOpen
} from 'lucide-react';

const GestionSalles = () => {
  const navigate = useNavigate();
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salleToDelete, setSalleToDelete] = useState(null);
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
      const response = await axiosInstance.get('/salles/');
      setSalles(response.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des salles', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!salleToDelete) return;
    try {
      await axiosInstance.delete(`/salles/${salleToDelete.id}/`);
      showNotification('Salle supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setSalleToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Filtrer et paginer
  const filteredSalles = salles.filter(s => {
    const matchSearch = !searchTerm ||
      (s.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.type_salle?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || s.type_salle === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredSalles.length / itemsPerPage);
  const paginatedSalles = filteredSalles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: salles.length,
    byType: {
      cours: salles.filter(s => s.type_salle === 'cours').length,
      tp: salles.filter(s => s.type_salle === 'tp').length,
      amphi: salles.filter(s => s.type_salle === 'amphi').length,
      sport: salles.filter(s => s.type_salle === 'sport').length,
    },
    capaciteTotale: salles.reduce((sum, s) => sum + (s.capacite || 0), 0)
  };

  const getTypeLabel = (type) => {
    const map = {
      cours: 'Cours',
      tp: 'Travaux Pratiques',
      amphi: 'Amphithéâtre',
      sport: 'Sport'
    };
    return map[type] || type;
  };

  const getTypeBadge = (type) => {
    const map = {
      cours: 'badge-primary',
      tp: 'badge-secondary',
      amphi: 'badge-accent',
      sport: 'badge-success'
    };
    return map[type] || 'badge-ghost';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'cours': return <BookOpen className="w-4 h-4" />;
      case 'tp': return <Building2 className="w-4 h-4" />;
      case 'amphi': return <Home className="w-4 h-4" />;
      case 'sport': return <Tag className="w-4 h-4" />;
      default: return <DoorOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des salles...
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
      {showDeleteModal && salleToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette salle ?</p>
              <p className="font-semibold text-error mt-2">{salleToDelete.nom}</p>
              {salleToDelete.capacite && (
                <p className="text-sm text-gray-500 mt-1">Capacité : {salleToDelete.capacite} places</p>
              )}
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
                <DoorOpen className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Salles</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les salles de l'établissement – {stats.total} salle(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/salles/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle salle
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
              <DoorOpen className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Cours</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.byType.cours}</p></div>
              <BookOpen className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">TP</p><p className="text-xl sm:text-2xl font-bold text-secondary">{stats.byType.tp}</p></div>
              <Building2 className="w-8 h-8 text-secondary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Amphi</p><p className="text-xl sm:text-2xl font-bold text-accent">{stats.byType.amphi}</p></div>
              <Home className="w-8 h-8 text-accent/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Sport</p><p className="text-xl sm:text-2xl font-bold text-success">{stats.byType.sport}</p></div>
              <Tag className="w-8 h-8 text-success/20" />
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
              placeholder="Rechercher par nom ou type..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="cours">Cours</option>
              <option value="tp">Travaux Pratiques</option>
              <option value="amphi">Amphithéâtre</option>
              <option value="sport">Sport</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setTypeFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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
                  <th className="py-4 font-semibold">Salle</th>
                  <th className="py-4 font-semibold">Type</th>
                  <th className="py-4 font-semibold text-center">Capacité</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSalles.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <DoorOpen className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucune salle trouvée</p>
                        <button onClick={() => navigate('/salles/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <Plus className="w-4 h-4" /> Ajouter une salle
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSalles.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <DoorOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{s.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getTypeBadge(s.type_salle)} gap-1`}>
                          {getTypeIcon(s.type_salle)}
                          {getTypeLabel(s.type_salle)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold">{s.capacite || 0}</span>
                          <span className="text-xs text-gray-400">places</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/salles/${s.id}`)} className="btn btn-ghost btn-sm btn-circle" title="Détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/salles/${s.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSalleToDelete(s); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error" title="Supprimer">
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
            {paginatedSalles.map(s => (
              <div key={s.id} className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <DoorOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{s.nom}</h3>
                        <span className={`badge ${getTypeBadge(s.type_salle)} text-xs gap-1`}>
                          {getTypeIcon(s.type_salle)}
                          {getTypeLabel(s.type_salle)}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown dropdown-end">
                      <button className="btn btn-ghost btn-sm btn-circle">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <button onClick={() => navigate(`/salles/${s.id}`)} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> Voir détails
                          </button>
                        </li>
                        <li>
                          <button onClick={() => navigate(`/salles/${s.id}/modifier`)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Modifier
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { setSalleToDelete(s); setShowDeleteModal(true); }} className="flex items-center gap-2 text-error">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Capacité : <span className="font-semibold">{s.capacite || 0}</span> places</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Type : {getTypeLabel(s.type_salle)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredSalles.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredSalles.length)}</span>{' '}
                sur <span className="font-semibold">{filteredSalles.length}</span> salles
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

export default GestionSalles;