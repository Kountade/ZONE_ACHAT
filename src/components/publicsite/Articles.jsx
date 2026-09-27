// src/components/publicsite/Articles.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Edit, Trash2, Loader2, FileText,
  Globe, Clock
} from 'lucide-react';

const Articles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
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
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      console.log('🔑 Token:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      // ✅ URL correcte : /articles/ (sans /api/)
      console.log('📡 Appel API: /articles/');
      const res = await axiosInstance.get('/articles/', headers);
      console.log('📦 Données reçues:', res.data);
      
      let articlesData = [];
      if (Array.isArray(res.data)) {
        articlesData = res.data;
      } else if (res.data?.results) {
        articlesData = res.data.results;
      } else if (typeof res.data === 'object') {
        articlesData = Object.values(res.data).filter(item => item && typeof item === 'object' && item.id);
      }
      
      console.log('📦 Articles traités:', articlesData);
      setArticles(articlesData);

      // Charger les catégories pour le filtre
      try {
        // ✅ URL correcte : /categories/ (sans /api/)
        const catRes = await axiosInstance.get('/categories/', headers);
        let catData = [];
        if (Array.isArray(catRes.data)) {
          catData = catRes.data;
        } else if (catRes.data?.results) {
          catData = catRes.data.results;
        }
        setCategories(catData);
      } catch (e) {
        console.warn('⚠️ Impossible de charger les catégories:', e);
      }

      // Statistiques
      const total = articlesData.length;
      const publies = articlesData.filter(a => a.statut === 'publie').length;
      const brouillons = articlesData.filter(a => a.statut === 'brouillon').length;
      const archives = articlesData.filter(a => a.statut === 'archive').length;
      setStats({ total, publies, brouillons, archives });

    } catch (error) {
      console.error('❌ Erreur complète:', error);
      
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Endpoint /articles/ non trouvé. Vérifiez l\'URL.');
      } else {
        setError('Erreur de chargement des articles');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      // ✅ URL correcte : /articles/${id}/ (sans /api/)
      await axiosInstance.delete(`/articles/${articleToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Article supprimé avec succès', 'success');
      fetchArticles();
      setShowDeleteModal(false);
      setArticleToDelete(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // FILTRES ET PAGINATION
  // ============================================================
  const filteredArticles = articles.filter(item => {
    if (!item) return false;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const matchSearch = !searchTerm ||
      (item.titre?.toLowerCase() || '').includes(searchLower) ||
      (item.extrait?.toLowerCase() || '').includes(searchLower);
    
    const matchStatut = statutFilter === 'all' || item.statut === statutFilter;
    const matchCategorie = categorieFilter === 'all' || item.categorie === parseInt(categorieFilter);
    
    return matchSearch && matchStatut && matchCategorie;
  });

  const totalItems = filteredArticles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredArticles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter, categorieFilter]);

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
    const configs = {
      'publie': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Publié' },
      'brouillon': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Brouillon' },
      'archive': { color: 'bg-gray-100 text-gray-600', icon: X, label: 'Archivé' }
    };
    const config = configs[statut] || configs['brouillon'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5 w-fit mx-auto`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Chargement des articles...</p>
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
            <button onClick={fetchArticles} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
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
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm ${
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
      {showDeleteModal && articleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 mt-1">
                Voulez-vous supprimer "{articleToDelete.titre}" ?
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
              <Globe className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Articles</h1>
              <p className="text-xs text-gray-500">{articles.length} article(s)</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={fetchArticles} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
            <button onClick={() => navigate('/articles/nouveau')} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Nouvel article
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      {stats && (
        <div className="w-full px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-green-600">{stats.publies}</p>
              <p className="text-[10px] text-gray-500">Publiés</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-yellow-600">{stats.brouillons}</p>
              <p className="text-[10px] text-gray-500">Brouillons</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-400">{stats.archives}</p>
              <p className="text-[10px] text-gray-500">Archivés</p>
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
            placeholder="Rechercher un article..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTRES */}
      <div className="w-full px-4 pb-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="publie">Publié</option>
            <option value="brouillon">Brouillon</option>
            <option value="archive">Archivé</option>
          </select>
          <select
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={categorieFilter}
            onChange={(e) => setCategorieFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="w-full px-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600">Titre</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Catégorie</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Auteur</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 text-sm">
                          {searchTerm ? 'Aucun article ne correspond' : 'Aucun article trouvé'}
                        </p>
                        <button onClick={() => navigate('/articles/nouveau')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Nouvel article
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.titre} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <span className="text-sm font-medium line-clamp-1">{item.titre || 'Sans titre'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.categorie_nom || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-sm text-gray-500">
                        {item.auteur_nom || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getStatutBadge(item.statut)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex justify-center gap-0.5">
                          <Link to={`/articles/${item.id}`} className="p-1 hover:bg-gray-100 rounded" title="Voir">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Link>
                          <Link to={`/articles/${item.id}/modifier`} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
                            <Edit className="w-3.5 h-3.5 text-gray-500" />
                          </Link>
                          <button 
                            onClick={() => { setArticleToDelete(item); setShowDeleteModal(true); }}
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

export default Articles;