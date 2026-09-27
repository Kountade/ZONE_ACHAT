// src/components/comptabilite/Caisses.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  X, CheckCircle, AlertCircle, Eye,
  ChevronLeft, ChevronRight, Loader2,
  Wallet, DollarSign, TrendingUp,
  User, Calendar, MoreVertical
} from 'lucide-react';

const Caisses = () => {
  const navigate = useNavigate();
  const [caisses, setCaisses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caisseToDelete, setCaisseToDelete] = useState(null);
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
      const res = await axiosInstance.get('/caisses/', headers);
      
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }
      
      setCaisses(data);

      // Calculer les stats
      const totalCaisses = data.length;
      const totalSolde = data.reduce((sum, c) => sum + parseFloat(c.solde_actuel || 0), 0);
      const caissesActives = data.filter(c => c.est_active).length;
      
      setStats({
        total: totalCaisses,
        soldeTotal: totalSolde,
        actives: caissesActives,
        inactives: totalCaisses - caissesActives
      });

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des caisses', 'error');
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
    if (!caisseToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/caisses/${caisseToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Caisse supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setCaisseToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des mouvements sont associés', 'error');
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

  const getTypeCaisseLabel = (type) => {
    const map = {
      principale: 'Principale',
      secondaire: 'Secondaire'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeCaisseColor = (type) => {
    const map = {
      principale: 'badge-primary',
      secondaire: 'badge-info'
    };
    return map[type] || 'badge-ghost';
  };

  const getStatusBadge = (estActive) => {
    return estActive ? 'badge-success' : 'badge-error';
  };

  const getStatusLabel = (estActive) => {
    return estActive ? 'Active' : 'Inactive';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredCaisses = caisses.filter(c => {
    const matchSearch = !searchTerm ||
      (c.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.responsable_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'all' || c.type_caisse === typeFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? c.est_active : !c.est_active);

    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filteredCaisses.length / itemsPerPage) || 1;
  const paginatedCaisses = filteredCaisses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 animate-pulse">
            Chargement des caisses...
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
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg rounded-xl max-w-md`}>
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
      {showDeleteModal && caisseToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-red-100 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette caisse ?</p>
              <p className="font-semibold text-red-600 mt-2 text-lg">{caisseToDelete.nom}</p>
              <p className="text-sm text-gray-500">{getTypeCaisseLabel(caisseToDelete.type_caisse)}</p>
              {parseFloat(caisseToDelete.solde_actuel || 0) > 0 && (
                <p className="text-sm text-yellow-600 mt-3">
                  ⚠️ Solde de {formatCurrency(caisseToDelete.solde_actuel)}
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

      {/* EN-TÊTE */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wallet className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Caisses</h1>
              <p className="text-sm text-gray-500">
                {caisses.length} caisse(s) au total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchData} 
              className="btn btn-outline btn-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/caisses/nouveau')} 
              className="btn btn-primary btn-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Plus className="w-4 h-4" />
              Nouvelle caisse
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Actives</p>
            <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Inactives</p>
            <p className="text-2xl font-bold text-red-600">{stats.inactives}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 uppercase">Solde total</p>
            <p className={`text-2xl font-bold ${stats.soldeTotal > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.soldeTotal)}
            </p>
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
              placeholder="Rechercher par nom ou responsable..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="principale">Principale</option>
              <option value="secondaire">Secondaire</option>
            </select>
            
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            
            <button 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              onClick={() => { 
                setTypeFilter('all');
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caisse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Responsable</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde initial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde actuel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCaisses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune caisse trouvée</p>
                    <button 
                      onClick={() => navigate('/caisses/nouveau')} 
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Ajouter une caisse
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedCaisses.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{c.nom}</p>
                          <p className="text-xs text-gray-400">
                            Créée le {formatDate(c.date_creation)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.type_caisse === 'principale' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getTypeCaisseLabel(c.type_caisse)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-3 h-3" />
                        {c.responsable_nom || 'Non assigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">
                      {formatCurrency(c.solde_initial)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${parseFloat(c.solde_actuel || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(c.solde_actuel)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.est_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusLabel(c.est_active)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/caisses/${c.id}`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/caisses/${c.id}/modifier`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/caisses/${c.id}`)} 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-green-600"
                          title="Mouvements"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setCaisseToDelete(c); setShowDeleteModal(true); }} 
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
        {filteredCaisses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold">{Math.min(currentPage*itemsPerPage, filteredCaisses.length)}</span>{' '}
                sur <span className="font-semibold">{filteredCaisses.length}</span>
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

export default Caisses;