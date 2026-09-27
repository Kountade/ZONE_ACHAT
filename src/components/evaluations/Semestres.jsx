// src/components/evaluations/Semestres.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  X, CheckCircle, AlertCircle, Eye,
  ChevronLeft, ChevronRight, Loader2,
  CalendarRange, Calendar, Clock, FileText,
  Printer, Lock, Unlock
} from 'lucide-react';

const Semestres = () => {
  const navigate = useNavigate();
  const [periodes, setPeriodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [periodeToDelete, setPeriodeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState(null);

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

      const response = await axiosInstance.get('/periodes/', headers);
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results) {
        data = response.data.results;
      } else if (typeof response.data === 'object') {
        data = Object.values(response.data).filter(item => item?.id);
      }
      
      setPeriodes(data);

      // Statistiques
      const total = data.length;
      const actives = data.filter(p => p.est_active === true).length;
      const cloturees = data.filter(p => p.est_cloture === true).length;
      setStats({ total, actives, cloturees });

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setPeriodes([]);
        showNotification('Aucune période trouvée', 'info');
      } else {
        showNotification('Erreur de chargement des périodes', 'error');
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
    if (!periodeToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/periodes/${periodeToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setPeriodeToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des données sont associées', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // CLÔTURER / ROUVRIR
  // ============================================================
  const handleClore = async (id) => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/periodes/${id}/clore/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période clôturée avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('❌ Erreur clôture:', error);
      showNotification('Erreur lors de la clôture', 'error');
    }
  };

  const handleRouvrir = async (id) => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/periodes/${id}/rouvrir/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période réouverte avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('❌ Erreur réouverture:', error);
      showNotification('Erreur lors de la réouverture', 'error');
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

  const getStatusBadge = (periode) => {
    if (periode?.est_cloture) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Clôturée</span>;
    }
    if (periode?.est_active) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">À venir</span>;
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredPeriodes = periodes.filter(p => {
    const matchSearch = !searchTerm ||
      (p?.libelle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p?.type_periode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p?.annee_libelle?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && p?.est_active && !p?.est_cloture) ||
      (statusFilter === 'cloturee' && p?.est_cloture) ||
      (statusFilter === 'a_venir' && !p?.est_active && !p?.est_cloture);

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredPeriodes.length / itemsPerPage) || 1;
  const paginatedPeriodes = filteredPeriodes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 animate-pulse">
            Chargement des périodes...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 p-4 bg-gray-50 min-h-screen">
      
      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-lg rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4" /> : 
                <AlertCircle className="w-4 h-4" />
              }
              <span className="font-medium">{notification.message}</span>
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

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && periodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
            <div className="bg-red-100 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette période ?</p>
              <p className="font-semibold text-red-600 mt-2 text-lg">{periodeToDelete?.libelle || 'Période'}</p>
              <p className="text-sm text-gray-500">{periodeToDelete?.type_periode || ''}</p>
              <p className="text-xs text-gray-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowDeleteModal(false)} 
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
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

      {/* EN-TÊTE */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <CalendarRange className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Périodes</h1>
              <p className="text-sm text-gray-500">
                {periodes.length} période(s) au total
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchData} 
              className="btn btn-outline btn-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/periodes/nouveau')} 
              className="btn btn-primary btn-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Plus className="w-4 h-4" />
              Nouvelle période
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Actives</p>
            <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Clôturées</p>
            <p className="text-2xl font-bold text-gray-600">{stats.cloturees}</p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par libellé, type ou année..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="cloturee">Clôturées</option>
              <option value="a_venir">À venir</option>
            </select>
            
            <button 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              onClick={() => { 
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Année</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPeriodes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <CalendarRange className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune période trouvée</p>
                    <button 
                      onClick={() => navigate('/periodes/nouveau')} 
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Ajouter une période
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedPeriodes.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CalendarRange className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p?.libelle || 'Sans libellé'}</p>
                          <p className="text-xs text-gray-400">
                            Créée le {formatDate(p?.date_creation)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {p?.type_periode || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{p?.annee_libelle || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(p?.date_debut)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(p?.date_fin)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {getStatusBadge(p)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        <button 
                          onClick={() => navigate(`/periodes/${p.id}`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/periodes/${p.id}/modifier`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!p?.est_cloture && (
                          <button 
                            onClick={() => handleClore(p.id)} 
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-orange-600"
                            title="Clôturer"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {p?.est_cloture && (
                          <button 
                            onClick={() => handleRouvrir(p.id)} 
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-green-600"
                            title="Rouvrir"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/periodes/${p.id}/pdf`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
                          title="PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setPeriodeToDelete(p); setShowDeleteModal(true); }} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
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

        {/* PAGINATION */}
        {filteredPeriodes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold">{Math.min(currentPage*itemsPerPage, filteredPeriodes.length)}</span>{' '}
                sur <span className="font-semibold">{filteredPeriodes.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="flex gap-1">
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                        className={`px-3 py-1 border border-gray-300 rounded-lg ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

export default Semestres;