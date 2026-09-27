// src/components/gestion/GestionMatieres.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, BookOpen, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Book, MoreVertical, School, BarChart, Layers, Hash
} from 'lucide-react';

const GestionMatieres = () => {
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [matiereToDelete, setMatiereToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matieresRes, niveauxRes] = await Promise.all([
        axiosInstance.get('/matieres/'),
        axiosInstance.get('/niveaux/')
      ]);
      
      const matieresData = Array.isArray(matieresRes.data) ? matieresRes.data : [];
      const niveauxData = Array.isArray(niveauxRes.data) ? niveauxRes.data : [];
      
      setMatieres(matieresData);
      setNiveaux(niveauxData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des matières', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!matiereToDelete) return;
    try {
      await axiosInstance.delete(`/matieres/${matiereToDelete.id}/`);
      showNotification('Matière supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setMatiereToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer (utilisée dans des cours)', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const safeMatieres = Array.isArray(matieres) ? matieres : [];
  const safeNiveaux = Array.isArray(niveaux) ? niveaux : [];

  const filteredMatieres = safeMatieres.filter(m => {
    const matchSearch = !searchTerm ||
      (m.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    let matchNiveau = niveauFilter === 'all';
    if (!matchNiveau && m.niveaux_config) {
      matchNiveau = m.niveaux_config.some(config => config.niveau === Number(niveauFilter));
    }

    return matchSearch && matchNiveau;
  });

  const totalPages = Math.ceil(filteredMatieres.length / itemsPerPage);
  const paginatedMatieres = filteredMatieres.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: safeMatieres.length,
    totalConfigurations: safeMatieres.reduce((sum, m) => sum + (m.niveaux_config?.length || 0), 0),
    avecPlusieursNiveaux: safeMatieres.filter(m => (m.niveaux_config?.length || 0) > 1).length,
  };

  const getNiveauNom = (id) => {
    const niveau = safeNiveaux.find(n => n.id === id);
    return niveau ? niveau.nom : 'Niveau inconnu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des matières...
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
      {showDeleteModal && matiereToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette matière ?</p>
              <p className="font-semibold text-error mt-2">{matiereToDelete.nom}</p>
              {matiereToDelete.niveaux_config && matiereToDelete.niveaux_config.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {matiereToDelete.niveaux_config.length} configuration(s) seront supprimées
                </p>
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

      {/* En-tête - identique à avant */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Matières</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les matières scolaires – {stats.total} matière(s), {stats.totalConfigurations} configuration(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/matieres/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle matière
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques - identiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Total matières</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p></div>
              <BookOpen className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Configurations</p><p className="text-xl sm:text-2xl font-bold text-info">{stats.totalConfigurations}</p></div>
              <Layers className="w-8 h-8 text-info/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 font-medium uppercase">Multi-niveaux</p><p className="text-xl sm:text-2xl font-bold text-warning">{stats.avecPlusieursNiveaux}</p></div>
              <BarChart className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - identiques */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les niveaux</option>
              {safeNiveaux.map(n => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setNiveauFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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
        {paginatedMatieres.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune matière trouvée</p>
              <button onClick={() => navigate('/matieres/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                <Plus className="w-4 h-4" /> Ajouter une matière
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                      <th className="py-4 font-semibold">Matière</th>
                      <th className="py-4 font-semibold">Code</th>
                      <th className="py-4 font-semibold">Configurations</th>
                      <th className="py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMatieres.map(m => (
                      <tr 
                        key={m.id} 
                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/matieres/${m.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Book className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold">{m.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {m.code ? <span className="badge badge-primary badge-sm">{m.code}</span> : <span className="text-gray-400 text-sm">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {m.niveaux_config && m.niveaux_config.length > 0 ? (
                              m.niveaux_config.map(config => (
                                <span key={config.id} className="badge badge-secondary badge-sm">
                                  {getNiveauNom(config.niveau)}: Coef {config.coefficient}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">Aucune configuration</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/matieres/${m.id}`); }} 
                              className="btn btn-ghost btn-sm btn-circle" 
                              title="Détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/matieres/${m.id}/modifier`); }} 
                              className="btn btn-ghost btn-sm btn-circle" 
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setMatiereToDelete(m); setShowDeleteModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle text-error" 
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {paginatedMatieres.map(m => (
                  <div 
                    key={m.id} 
                    className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200 cursor-pointer hover:border-primary"
                    onClick={() => navigate(`/matieres/${m.id}`)}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Book className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{m.nom}</h3>
                            {m.code && <span className="badge badge-primary badge-xs">{m.code}</span>}
                          </div>
                        </div>
                        <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-circle">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li><button onClick={() => navigate(`/matieres/${m.id}`)}><Eye className="w-4 h-4" /> Voir détails</button></li>
                            <li><button onClick={() => navigate(`/matieres/${m.id}/modifier`)}><Edit className="w-4 h-4" /> Modifier</button></li>
                            <li><button onClick={() => { setMatiereToDelete(m); setShowDeleteModal(true); }} className="text-error"><Trash2 className="w-4 h-4" /> Supprimer</button></li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.niveaux_config && m.niveaux_config.length > 0 ? (
                          m.niveaux_config.map(config => (
                            <span key={config.id} className="badge badge-secondary badge-sm">
                              {getNiveauNom(config.niveau)}: {config.coefficient}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">Aucune configuration</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span>{m.niveaux_config?.length || 0} configuration(s)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination - identique */}
        {filteredMatieres.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredMatieres.length)}</span>{' '}
                sur <span className="font-semibold">{filteredMatieres.length}</span> matières
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

export default GestionMatieres;