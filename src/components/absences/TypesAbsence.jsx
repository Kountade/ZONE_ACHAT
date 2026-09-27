// src/components/absences/TypesAbsence.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Printer,
  Tag,
  Palette,
  FileText,
  Check,
  UserX,
  Clock
} from 'lucide-react';

const TypesAbsence = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [types, setTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActif, setFilterActif] = useState('all');
  const [filterJustifie, setFilterJustifie] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    justifies: 0,
    non_justifies: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // 1. Charger les statistiques
        try {
          const statsRes = await axiosInstance.get('/types-absence/statistiques/', headers);
          if (statsRes.data) {
            setStats(statsRes.data);
          }
        } catch (e) {
          console.warn('Impossible de charger les statistiques:', e);
        }

        // 2. Charger les types
        await loadTypes();

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // ============================================================
  // CHARGEMENT DES TYPES
  // ============================================================
  const loadTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActif !== 'all') params.append('est_actif', filterActif);
      if (filterJustifie !== 'all') params.append('est_justifie', filterJustifie);

      const url = `/types-absence/?${params.toString()}`;
      const res = await axiosInstance.get(url, headers);

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      setTypes(data);
      setTotalItems(data.length);

    } catch (err) {
      console.error('❌ Erreur chargement types:', err);
      if (err.response?.status === 404) {
        setTypes([]);
        setTotalItems(0);
        showMessage('Aucun type d\'absence trouvé', 'info');
      } else {
        showMessage('Erreur lors du chargement des types', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!typeToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/types-absence/${typeToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Type supprimé avec succès', 'success');
      loadTypes();
      setShowDeleteModal(false);
      setTypeToDelete(null);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // FILTRES ET PAGINATION
  // ============================================================
  const getFilteredData = () => {
    let filtered = [...types];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        (t.nom || '').toLowerCase().includes(search) ||
        (t.code || '').toLowerCase().includes(search) ||
        (t.description || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();
  const totalFiltered = filteredData.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActif, filterJustifie]);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getStatutBadge = (estActif) => {
    if (estActif) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit">
          <CheckCircle2 className="h-3 w-3" /> Actif
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1 w-fit">
        <X className="h-3 w-3" /> Inactif
      </span>
    );
  };

  const getJustifieBadge = (estJustifie) => {
    if (estJustifie) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 w-fit">
          <Check className="h-3 w-3" /> Justifié
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-fit">
        <UserX className="h-3 w-3" /> Non justifié
      </span>
    );
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (types.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Nom', 'Code', 'Justifié', 'Actif', 'Description'];
    const rows = types.map(t => [
      t.nom || '-',
      t.code || '-',
      t.est_justifie ? 'Oui' : 'Non',
      t.est_actif ? 'Oui' : 'Non',
      t.description || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `types_absence_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des types d'absence...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">Erreur de chargement</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Message de notification */}
      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : messageType === 'info'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && typeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer le type <strong>{typeToDelete.nom}</strong> ?
              </p>
              <p className="text-sm text-red-500 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Tag className="h-6 w-6 text-blue-600" />
                Types d'absence
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadTypes}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={types.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => navigate('/types-absence/nouveau')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Nouveau type
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* STATISTIQUES */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Actifs</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{stats.actifs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Inactifs</p>
            <p className="text-base sm:text-lg font-bold text-gray-600">{stats.inactifs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Justifiés</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{stats.justifies}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Non justifiés</p>
            <p className="text-base sm:text-lg font-bold text-red-600">{stats.non_justifies}</p>
          </div>
        </div>

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="h-4 w-4 inline mr-1" />
                Recherche
              </label>
              <input
                type="text"
                placeholder="Rechercher un type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <select
                value={filterActif}
                onChange={(e) => setFilterActif(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Justifié
              </label>
              <select
                value={filterJustifie}
                onChange={(e) => setFilterJustifie(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="true">Justifiés</option>
                <option value="false">Non justifiés</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadTypes}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Filtrer
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterActif('all');
                  setFilterJustifie('all');
                  loadTypes();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Effacer
              </button>
            </div>

          </div>
        </div>

        {/* TABLEAU DES TYPES */}
        {types.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Nom
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Code
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                      <Check className="h-4 w-4 inline mr-1" />
                      Justifié
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Statut
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">
                      Description
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.couleur || '#888' }}
                          />
                          <span className="font-medium text-gray-800">{item.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-gray-600">{item.code}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {getJustifieBadge(item.est_justifie)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatutBadge(item.est_actif)}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500 truncate block max-w-[200px]">
                          {item.description || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/types-absence/${item.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/types-absence/${item.id}/modifier`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => {
                              setTypeToDelete(item);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalFiltered > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  {startIndex + 1} - {endIndex} sur {totalFiltered} résultat(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
                        className={`px-3 py-1 border rounded transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun type d'absence</h3>
            <p className="text-gray-500">
              {searchTerm || filterActif !== 'all' || filterJustifie !== 'all' 
                ? 'Aucun type ne correspond aux filtres' 
                : 'Aucun type d\'absence enregistré'}
            </p>
            <button
              onClick={() => navigate('/types-absence/nouveau')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Nouveau type
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypesAbsence;