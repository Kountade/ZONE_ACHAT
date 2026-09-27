// src/components/publicsite/Programmes.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, BookCopy, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  MoreVertical, Clock, Archive, Image as ImageIcon
} from 'lucide-react';

const Programmes = () => {
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programmeToDelete, setProgrammeToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState(null);

  const NIVEAUX = [
    { value: 'primaire', label: 'Primaire' },
    { value: 'college', label: 'Collège' },
    { value: 'lycee', label: 'Lycée' },
    { value: 'tous', label: 'Tous niveaux' },
  ];

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Récupération des données
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      const [programmesRes, categoriesRes] = await Promise.all([
        axiosInstance.get('/programmes/', headers),
        axiosInstance.get('/categories/', headers)
      ]);
      
      let programmesData = [];
      if (Array.isArray(programmesRes.data)) {
        programmesData = programmesRes.data;
      } else if (programmesRes.data?.results) {
        programmesData = programmesRes.data.results;
      } else if (typeof programmesRes.data === 'object') {
        programmesData = Object.values(programmesRes.data).filter(item => item && typeof item === 'object' && item.id);
      }
      setProgrammes(programmesData);

      let categoriesData = [];
      if (Array.isArray(categoriesRes.data)) {
        categoriesData = categoriesRes.data;
      } else if (categoriesRes.data?.results) {
        categoriesData = categoriesRes.data.results;
      }
      setCategories(categoriesData);

      // Statistiques
      const total = programmesData.length;
      const publies = programmesData.filter(p => p.statut === 'publie').length;
      const brouillons = programmesData.filter(p => p.statut === 'brouillon').length;
      const archives = programmesData.filter(p => p.statut === 'archive').length;
      setStats({ total, publies, brouillons, archives });

    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des programmes', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!programmeToDelete) return;
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/programmes/${programmeToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Programme supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setProgrammeToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // Filtrer et paginer
  const filteredProgrammes = programmes.filter(p => {
    const matchSearch = !searchTerm ||
      (p.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === 'all' || p.statut === statutFilter;
    const matchNiveau = niveauFilter === 'all' || p.niveau === niveauFilter;
    const matchCategorie = categorieFilter === 'all' || p.categorie === parseInt(categorieFilter);
    return matchSearch && matchStatut && matchNiveau && matchCategorie;
  });

  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);
  const paginatedProgrammes = filteredProgrammes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatutBadge = (statut) => {
    const map = {
      'publie': 'badge-success',
      'brouillon': 'badge-warning',
      'archive': 'badge-ghost'
    };
    const labels = {
      'publie': 'Publié',
      'brouillon': 'Brouillon',
      'archive': 'Archivé'
    };
    return { class: map[statut] || 'badge-ghost', label: labels[statut] || statut };
  };

  const getNiveauBadge = (niveau) => {
    const map = {
      primaire: 'badge-primary',
      college: 'badge-secondary',
      lycee: 'badge-accent',
      tous: 'badge-ghost'
    };
    const niv = NIVEAUX.find(n => n.value === niveau);
    return { class: map[niveau] || 'badge-ghost', label: niv?.label || niveau };
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Fonction pour obtenir l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Si l'URL commence déjà par http, la retourner telle quelle
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Sinon, ajouter le baseURL
    const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:8000';
    return `${baseURL}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des programmes...
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
      {showDeleteModal && programmeToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce programme ?</p>
              <p className="font-semibold text-error mt-2">{programmeToDelete.titre}</p>
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
                <BookCopy className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Programmes</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les programmes de l'établissement – {programmes.length} programme(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/programes/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <Plus className="w-4 h-4" />
              Nouveau programme
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Total</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p></div>
                <BookCopy className="w-8 h-8 text-primary/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Publiés</p><p className="text-xl sm:text-2xl font-bold text-success">{stats.publies}</p></div>
                <CheckCircle className="w-8 h-8 text-success/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Brouillons</p><p className="text-xl sm:text-2xl font-bold text-warning">{stats.brouillons}</p></div>
                <Clock className="w-8 h-8 text-warning/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Archivés</p><p className="text-xl sm:text-2xl font-bold text-gray-400">{stats.archives}</p></div>
                <Archive className="w-8 h-8 text-gray-400/20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou description..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="publie">Publié</option>
              <option value="brouillon">Brouillon</option>
              <option value="archive">Archivé</option>
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les niveaux</option>
              {NIVEAUX.map(niv => (
                <option key={niv.value} value={niv.value}>{niv.label}</option>
              ))}
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={categorieFilter} onChange={(e) => { setCategorieFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setStatutFilter('all'); setNiveauFilter('all'); setCategorieFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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
                  <th className="py-4 font-semibold">Titre</th>
                  <th className="py-4 font-semibold">Niveau</th>
                  <th className="py-4 font-semibold">Catégorie</th>
                  <th className="py-4 font-semibold text-center">Statut</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProgrammes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <BookCopy className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun programme trouvé</p>
                        <button onClick={() => navigate('/programes/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <Plus className="w-4 h-4" /> Ajouter un programme
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProgrammes.map(p => {
                    const imageUrl = getImageUrl(p.image_url);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={p.titre} 
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <svg class="w-5 h-5 text-primary" ...>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookCopy className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{p.titre}</p>
                              {p.est_populaire && (
                                <span className="badge badge-warning badge-xs mt-1">Populaire</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getNiveauBadge(p.niveau).class}`}>
                            {getNiveauBadge(p.niveau).label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                            {p.categorie_nom || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`badge ${getStatutBadge(p.statut).class}`}>
                            {getStatutBadge(p.statut).label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Link to={`/programes/${p.id}`} className="btn btn-ghost btn-sm btn-circle" title="Détails">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link to={`/programes/${p.id}/modifier`} className="btn btn-ghost btn-sm btn-circle" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button onClick={() => { setProgrammeToDelete(p); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paginatedProgrammes.map(p => {
              const imageUrl = getImageUrl(p.image_url);
              return (
                <div key={p.id} className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={p.titre} 
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookCopy className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-sm">{p.titre}</h3>
                          {p.est_populaire && (
                            <span className="badge badge-warning badge-xs">Populaire</span>
                          )}
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <button className="btn btn-ghost btn-sm btn-circle">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li>
                            <Link to={`/programes/${p.id}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Voir détails
                            </Link>
                          </li>
                          <li>
                            <Link to={`/programes/${p.id}/modifier`} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Modifier
                            </Link>
                          </li>
                          <li>
                            <button onClick={() => { setProgrammeToDelete(p); setShowDeleteModal(true); }} className="flex items-center gap-2 text-error">
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`badge ${getNiveauBadge(p.niveau).class} text-xs`}>
                        {getNiveauBadge(p.niveau).label}
                      </span>
                      <span className={`badge ${getStatutBadge(p.statut).class} text-xs`}>
                        {getStatutBadge(p.statut).label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.categorie_nom || 'Sans catégorie'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(p.date_publication || p.date_creation)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredProgrammes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredProgrammes.length)}</span>{' '}
                sur <span className="font-semibold">{filteredProgrammes.length}</span> programmes
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

export default Programmes;