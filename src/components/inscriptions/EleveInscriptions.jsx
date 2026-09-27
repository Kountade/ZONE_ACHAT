// src/components/inscriptions/EleveInscriptions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Edit, Trash2, FileText, Calendar, User,
  GraduationCap, School, Filter, ChevronLeft, ChevronRight,
  Loader2, UserPlus, AlertTriangle, Wifi, WifiOff,
  Building2, Users
} from 'lucide-react';

const EleveInscriptions = () => {
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inscriptionToDelete, setInscriptionToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [anneesScolaires, setAnneesScolaires] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // Récupérer les inscriptions
      const inscriptionsRes = await axiosInstance.get('/inscriptions/', headers);
      
      // S'assurer que les données sont un tableau
      let inscriptionsData = [];
      if (Array.isArray(inscriptionsRes.data)) {
        inscriptionsData = inscriptionsRes.data;
      } else if (inscriptionsRes.data && typeof inscriptionsRes.data === 'object') {
        // Si c'est un objet avec une propriété 'results' (pagination DRF)
        if (Array.isArray(inscriptionsRes.data.results)) {
          inscriptionsData = inscriptionsRes.data.results;
        } else {
          // Si c'est un objet, essayer de le convertir en tableau
          inscriptionsData = Object.values(inscriptionsRes.data).flat();
        }
      }
      
      setInscriptions(inscriptionsData);

      // Récupérer les années scolaires
      try {
        const anneesRes = await axiosInstance.get('/annees-scolaires/', headers);
        setAnneesScolaires(Array.isArray(anneesRes.data) ? anneesRes.data : []);
      } catch (anneeError) {
        console.warn('Impossible de charger les années scolaires:', anneeError);
        setAnneesScolaires([]);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Endpoint non trouvé. Vérifiez la configuration de l\'API.');
      } else {
        setError('Erreur de chargement des inscriptions');
        showNotification('Erreur de chargement des inscriptions', 'error');
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
    if (!inscriptionToDelete) return;
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/inscriptions/${inscriptionToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Inscription supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setInscriptionToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredInscriptions = inscriptions.filter(item => {
    if (!item) return false;
    
    // Construction sécurisée du nom complet
    const prenom = item.eleve_prenom || '';
    const nom = item.eleve_nom || '';
    const eleveNom = `${prenom} ${nom}`.toLowerCase().trim();
    const searchLower = searchTerm.toLowerCase().trim();
    
    const matchSearch = !searchTerm ||
      eleveNom.includes(searchLower) ||
      (item.eleve_matricule || '').toLowerCase().includes(searchLower);

    const matchAnnee = anneeFilter === 'all' || item.annee_scolaire === parseInt(anneeFilter);
    const matchStatut = statutFilter === 'all' || item.statut === statutFilter;

    return matchSearch && matchAnnee && matchStatut;
  });

  // Pagination
  const totalItems = filteredInscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredInscriptions.slice(startIndex, endIndex);

  // ============================================================
  // RÉINITIALISER LA PAGE QUAND LES FILTRES CHANGENT
  // ============================================================
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, anneeFilter, statutFilter]);

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

  const getStatutBadge = (statut) => {
    const map = {
      inscrit: 'badge-success',
      reinscrit: 'badge-info',
      transfert: 'badge-warning',
      abandon: 'badge-error'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      inscrit: 'Inscrit',
      reinscrit: 'Réinscrit',
      transfert: 'Transfert',
      abandon: 'Abandon'
    };
    return map[statut] || statut || 'Inconnu';
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-base-content/70 animate-pulse">
            Chargement des inscriptions...
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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-16 h-16 text-error mx-auto" />
          <h3 className="text-xl font-bold text-error">Erreur</h3>
          <p className="text-gray-600">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm gap-2">
              Accueil
            </button>
            <button onClick={fetchData} className="btn btn-primary btn-sm gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium text-sm">{notification.message}</span>
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
      {showDeleteModal && inscriptionToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette inscription ?</p>
              <p className="font-semibold mt-2 text-lg">
                {inscriptionToDelete.eleve_prenom || ''} {inscriptionToDelete.eleve_nom || 'Élève'}
              </p>
              <p className="text-sm text-gray-500">{inscriptionToDelete.annee_libelle || 'Année inconnue'}</p>
              <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button 
                className="btn btn-ghost flex-1" 
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn btn-error flex-1 gap-2" 
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
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
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">Inscriptions</h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm text-base-content/60">
                    {inscriptions.length} inscription(s)
                  </span>
                  <span className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 text-xs`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchData} 
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/inscriptions/nouveau')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle inscription
            </button>
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
              placeholder="Rechercher par nom, prénom ou matricule..."
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
          
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={anneeFilter} 
              onChange={(e) => setAnneeFilter(e.target.value)}
            >
              <option value="all">Toutes les années</option>
              {anneesScolaires.map(a => (
                <option key={a.id} value={a.id}>
                  {a.libelle || `Année ${a.id}`}
                </option>
              ))}
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={statutFilter} 
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="inscrit">Inscrit</option>
              <option value="reinscrit">Réinscrit</option>
              <option value="transfert">Transfert</option>
              <option value="abandon">Abandon</option>
            </select>
            
            <button 
              className="btn btn-outline gap-2 hover:bg-primary/10 transition-all" 
              onClick={() => {
                setAnneeFilter('all');
                setStatutFilter('all');
                setSearchTerm('');
              }}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATISTIQUES RAPIDES
          ============================================================ */}
      {inscriptions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-primary">{inscriptions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Inscrits</p>
            <p className="text-lg font-bold text-success">
              {inscriptions.filter(i => i.statut === 'inscrit').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Réinscrits</p>
            <p className="text-lg font-bold text-info">
              {inscriptions.filter(i => i.statut === 'reinscrit').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Transferts</p>
            <p className="text-lg font-bold text-warning">
              {inscriptions.filter(i => i.statut === 'transfert').length}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          TABLEAU
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                <th className="py-4 px-3 font-semibold">Élève</th>
                <th className="py-4 px-3 font-semibold hidden sm:table-cell">Matricule</th>
                <th className="py-4 px-3 font-semibold hidden md:table-cell">Année</th>
                <th className="py-4 px-3 font-semibold hidden lg:table-cell">Niveau</th>
                <th className="py-4 px-3 font-semibold hidden lg:table-cell">Classe</th>
                <th className="py-4 px-3 font-semibold hidden sm:table-cell">Date</th>
                <th className="py-4 px-3 font-semibold">Statut</th>
                <th className="py-4 px-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || anneeFilter !== 'all' || statutFilter !== 'all' 
                          ? 'Aucune inscription ne correspond aux filtres'
                          : 'Aucune inscription trouvée'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {searchTerm || anneeFilter !== 'all' || statutFilter !== 'all'
                          ? 'Essayez de modifier vos filtres de recherche'
                          : 'Commencez par créer une nouvelle inscription'}
                      </p>
                      <button 
                        onClick={() => navigate('/inscriptions/nouveau')} 
                        className="btn btn-primary btn-sm gap-2 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Nouvelle inscription
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  // Sécurisation des données
                  const prenom = item.eleve_prenom || 'Prénom';
                  const nom = item.eleve_nom || 'Nom';
                  const matricule = item.eleve_matricule || 'N/A';
                  const anneeLibelle = item.annee_libelle || '-';
                  const niveauNom = item.niveau_nom || '-';
                  const classeNom = item.classe_nom || '-';
                  const statut = item.statut || 'inscrit';
                  const dateInscription = item.date_inscription || '';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p 
                              className="font-semibold hover:text-primary cursor-pointer transition-colors truncate"
                              onClick={() => navigate(`/inscriptions/${item.id}`)}
                            >
                              {prenom} {nom}
                            </p>
                            <p className="text-xs text-gray-400 sm:hidden">
                              {matricule}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {matricule}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-sm">{anneeLibelle}</span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-sm">{niveauNom}</span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-sm">{classeNom}</span>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className="text-sm">{formatDate(dateInscription)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`badge ${getStatutBadge(statut)}`}>
                          {getStatutLabel(statut)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/inscriptions/${item.id}`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/inscriptions/${item.id}/modifier`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/inscriptions/${item.id}/pdf`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setInscriptionToDelete(item);
                              setShowDeleteModal(true);
                            }} 
                            className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                            title="Supprimer"
                          >
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

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {totalItems > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{startIndex + 1}</span> à{' '}
                <span className="font-semibold text-primary">{endIndex}</span>{' '}
                sur <span className="font-semibold">{totalItems}</span> inscriptions
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
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
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

export default EleveInscriptions;