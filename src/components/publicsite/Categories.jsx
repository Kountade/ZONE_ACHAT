// src/components/publicsite/Categories.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { 
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Edit, Trash2, Loader2, Tag, ChevronLeft, ChevronRight
} from 'lucide-react';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [error, setError] = useState(null);
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
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      // ✅ URL correcte sans /api/
      const res = await axiosInstance.get('/categories/', headers);
      
      console.log('📦 Catégories reçues:', res.data);
      
      let categoriesData = [];
      if (Array.isArray(res.data)) {
        categoriesData = res.data;
      } else if (res.data?.results) {
        categoriesData = res.data.results;
      } else if (typeof res.data === 'object') {
        categoriesData = Object.values(res.data).filter(item => item && typeof item === 'object' && item.id);
      }
      setCategories(categoriesData);

      // Statistiques
      const total = categoriesData.length;
      const actives = categoriesData.filter(c => c.est_active !== false).length;
      const inactives = total - actives;
      setStats({ total, actives, inactives });

    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      console.error('❌ Response:', error.response);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Endpoint non trouvé. Vérifiez la configuration.');
      } else {
        setError('Erreur de chargement des catégories');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/categories/${categoryToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Catégorie supprimée avec succès', 'success');
      fetchCategories();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des articles sont associés', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // FILTRES ET PAGINATION
  // ============================================================
  const filteredCategories = categories.filter(item => {
    if (!item) return false;
    const searchLower = searchTerm.toLowerCase().trim();
    return !searchTerm ||
      (item.nom?.toLowerCase() || '').includes(searchLower) ||
      (item.description?.toLowerCase() || '').includes(searchLower);
  });

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredCategories.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">Erreur</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <div className="flex gap-2 justify-center mt-3">
            <button onClick={() => navigate('/dashboard')} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-300">
              Dashboard
            </button>
            <button onClick={fetchCategories} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Réessayer
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
    <div className="w-full min-h-screen bg-gray-50">
      
      {/* NOTIFICATION */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 mt-1">
                Voulez-vous supprimer "{categoryToDelete.nom}" ?
              </p>
              <p className="text-xs text-red-500 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button 
                className="flex-1 px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="flex-1 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1.5"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/blog')} className="p-1 hover:bg-gray-100 rounded-lg">
              <Tag className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Catégories</h1>
              <p className="text-xs text-gray-500">{categories.length} catégorie(s)</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={fetchCategories} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
            <button onClick={() => navigate('/categories/nouveau')} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      {stats && (
        <div className="w-full px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-green-600">{stats.actives}</p>
              <p className="text-[10px] text-gray-500">Actives</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-400">{stats.inactives}</p>
              <p className="text-[10px] text-gray-500">Inactives</p>
            </div>
          </div>
        </div>
      )}

      {/* RECHERCHE */}
      <div className="w-full px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLEAU */}
      <div className="w-full px-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Slug</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Couleur</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600 hidden lg:table-cell">Articles</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 text-sm">
                          {searchTerm ? 'Aucune catégorie ne correspond' : 'Aucune catégorie trouvée'}
                        </p>
                        <button onClick={() => navigate('/categories/nouveau')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Nouvelle catégorie
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.couleur || '#3b82f6' }}
                          />
                          <span className="text-sm font-medium">{item.nom}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-sm text-gray-500">
                        {item.slug || '-'}
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        {item.couleur ? (
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-5 h-5 rounded border border-gray-200"
                              style={{ backgroundColor: item.couleur }}
                            />
                            <span className="text-xs text-gray-500">{item.couleur}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-center">
                        <span className="text-sm">{item.nombre_articles || 0}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.est_active !== false ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5 w-fit mx-auto">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5 w-fit mx-auto">
                            <X className="w-3 h-3" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex justify-center gap-0.5">
                          <Link to={`/categories/${item.id}`} className="p-1 hover:bg-gray-100 rounded" title="Voir">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Link>
                          <Link to={`/categories/${item.id}/modifier`} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
                            <Edit className="w-3.5 h-3.5 text-gray-500" />
                          </Link>
                          <button 
                            onClick={() => { setCategoryToDelete(item); setShowDeleteModal(true); }}
                            className="p-1 hover:bg-red-100 rounded" title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
          {totalItems > 0 && (
            <div className="px-3 py-2.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-gray-500">
                {startIndex + 1} - {endIndex} sur {totalItems}
              </span>
              <div className="flex gap-0.5">
                <button 
                  className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                >
                  «
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
                      className={`px-2.5 py-1 text-sm border rounded ${
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
                  className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
              <select
                className="px-2 py-0.5 text-sm border border-gray-300 rounded"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;