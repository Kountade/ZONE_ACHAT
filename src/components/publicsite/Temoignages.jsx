// src/components/publicsite/Temoignages.jsx

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
  User,
  Star,
  Quote,
  Image,
  Download,
  Filter,
  Grid,
  List,
  SortAsc,
  SortDesc,
  FileText,
  Check,
  Calendar,
  Users
} from 'lucide-react';

const Temoignages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [temoignages, setTemoignages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublie, setFilterPublie] = useState('all');
  const [filterEnUne, setFilterEnUne] = useState('all');
  const [sortBy, setSortBy] = useState('ordre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    publies: 0,
    en_une: 0,
    brouillons: 0,
    moyenne_notes: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [temoignageToDelete, setTemoignageToDelete] = useState(null);
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
  // FONCTION POUR OBTENIR L'URL DE L'IMAGE
  // ============================================================
  const getImageUrl = (item) => {
    if (!item) return null;
    
    // Priorité 1: image du modèle
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image;
      }
      return `${axiosInstance.defaults.baseURL}${item.image}`;
    }
    
    // Priorité 2: avatar_url du modèle
    if (item.avatar_url) {
      if (item.avatar_url.startsWith('http')) {
        return item.avatar_url;
      }
      return `${axiosInstance.defaults.baseURL}${item.avatar_url}`;
    }
    
    return null;
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

        // Charger les statistiques
        try {
          const statsRes = await axiosInstance.get('/temoignages/statistiques/', headers);
          if (statsRes.data) {
            setStats(statsRes.data);
          }
        } catch (e) {
          console.warn('Impossible de charger les statistiques:', e);
        }

        await loadTemoignages();

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
  // CHARGEMENT DES TÉMOIGNAGES
  // ============================================================
  const loadTemoignages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterPublie !== 'all') params.append('publie', filterPublie);
      if (filterEnUne !== 'all') params.append('en_une', filterEnUne);
      if (sortBy) params.append('ordering', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);

      const url = `/temoignages/?${params.toString()}`;
      const res = await axiosInstance.get(url, headers);

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      setTemoignages(data);
      setTotalItems(data.length);
      
      // Calculer les statistiques
      const total = data.length;
      const publies = data.filter(t => t.est_publie === true).length;
      const en_une = data.filter(t => t.est_en_une === true).length;
      const brouillons = data.filter(t => t.est_publie === false).length;
      const notes = data.filter(t => t.est_publie === true && t.note);
      const moyenne_notes = notes.length > 0 
        ? (notes.reduce((acc, t) => acc + (t.note || 0), 0) / notes.length).toFixed(1)
        : 0;

      setStats({ total, publies, en_une, brouillons, moyenne_notes });

    } catch (err) {
      console.error('❌ Erreur chargement témoignages:', err);
      if (err.response?.status === 404) {
        setTemoignages([]);
        setTotalItems(0);
        showMessage('Aucun témoignage trouvé', 'info');
      } else if (err.response?.status === 401) {
        showMessage('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage('Erreur lors du chargement des témoignages', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!temoignageToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/temoignages/${temoignageToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Témoignage supprimé avec succès', 'success');
      loadTemoignages();
      setShowDeleteModal(false);
      setTemoignageToDelete(null);
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
    let filtered = [...temoignages];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        (t.nom || '').toLowerCase().includes(search) ||
        (t.role || '').toLowerCase().includes(search) ||
        (t.contenu || '').toLowerCase().includes(search)
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
  }, [searchTerm, filterPublie, filterEnUne, sortBy, sortOrder]);

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (temoignages.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Nom', 'Rôle', 'Contenu', 'Note', 'Publié', 'À la une', 'Ordre', 'Date'];
    const rows = temoignages.map(t => [
      t.nom || '-',
      t.role || '-',
      (t.contenu || '').replace(/,/g, ' '),
      t.note || 0,
      t.est_publie ? 'Oui' : 'Non',
      t.est_en_une ? 'Oui' : 'Non',
      t.ordre || 0,
      t.date_creation ? new Date(t.date_creation).toLocaleDateString('fr-FR') : '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `temoignages_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatutBadge = (estPublie) => {
    if (estPublie) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit">
          <Check className="h-3 w-3" /> Publié
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1 w-fit">
        <X className="h-3 w-3" /> Brouillon
      </span>
    );
  };

  const getEnUneBadge = (estEnUne) => {
    if (estEnUne) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 w-fit">
          <Star className="h-3 w-3 fill-blue-500" /> Une
        </span>
      );
    }
    return <span className="text-xs text-gray-400">-</span>;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des témoignages...</p>
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
      {showDeleteModal && temoignageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer le témoignage de <strong>{temoignageToDelete.nom}</strong> ?
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
                <Quote className="h-6 w-6 text-blue-600" />
                Témoignages
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadTemoignages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={temoignages.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => navigate('/temoignages/nouveau')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Nouveau témoignage
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
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Publiés</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{stats.publies}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Brouillons</p>
            <p className="text-base sm:text-lg font-bold text-gray-600">{stats.brouillons}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">À la une</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{stats.en_une}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Note moyenne</p>
            <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.moyenne_notes || 0}</p>
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
                placeholder="Rechercher par nom, rôle..."
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
                value={filterPublie}
                onChange={(e) => setFilterPublie(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="true">Publiés</option>
                <option value="false">Brouillons</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Star className="h-4 w-4 inline mr-1" />
                À la une
              </label>
              <select
                value={filterEnUne}
                onChange={(e) => setFilterEnUne(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="true">À la une</option>
                <option value="false">Non mis en une</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <SortAsc className="h-4 w-4 inline mr-1" />
                Trier par
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ordre">Ordre</option>
                  <option value="nom">Nom</option>
                  <option value="note">Note</option>
                  <option value="date_creation">Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={loadTemoignages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Filtrer
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPublie('all');
                setFilterEnUne('all');
                setSortBy('ordre');
                setSortOrder('asc');
                loadTemoignages();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border rounded-lg transition ${viewMode === 'list' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 border rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                title="Vue grille"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TABLEAU DES TÉMOIGNAGES */}
        {temoignages.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                        <Image className="h-4 w-4 inline mr-1" />
                        Avatar
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                        <User className="h-4 w-4 inline mr-1" />
                        Nom
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                        <Users className="h-4 w-4 inline mr-1" />
                        Rôle
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                        <Star className="h-4 w-4 inline mr-1" />
                        Note
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                        Statut
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 hidden lg:table-cell">
                        Une
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => {
                      const imageUrl = getImageUrl(item);
                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">
                            {imageUrl ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                                <img 
                                  src={imageUrl} 
                                  alt={item.nom} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.parentElement.innerHTML = `
                                      <div class="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 bg-gray-50">
                                        <User class="h-5 w-5" />
                                      </div>
                                    `;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 bg-gray-50">
                                <User className="h-5 w-5" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-800">{item.nom || 'Anonyme'}</span>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className="text-sm text-gray-500">{item.role || '-'}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              {renderStars(item.note || 0)}
                              <span className="text-xs text-gray-400 ml-1">({item.note || 0})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStatutBadge(item.est_publie)}
                          </td>
                          <td className="py-3 px-4 text-center hidden lg:table-cell">
                            {getEnUneBadge(item.est_en_une)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => navigate(`/temoignages/${item.id}`)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => navigate(`/temoignages/${item.id}/modifier`)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => {
                                  setTemoignageToDelete(item);
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
                      );
                    })}
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
            // VUE GRILLE
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedData.map((item) => {
                const imageUrl = getImageUrl(item);
                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition">
                    <div className="flex flex-col items-center text-center">
                      {imageUrl ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 mb-3">
                          <img 
                            src={imageUrl} 
                            alt={item.nom} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.parentElement.innerHTML = `
                                <div class="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 bg-gray-50">
                                  <User class="h-10 w-10" />
                                </div>
                              `;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 bg-gray-50 mb-3">
                          <User className="h-10 w-10" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-800">{item.nom || 'Anonyme'}</h3>
                      {item.role && (
                        <p className="text-sm text-gray-500">{item.role}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(item.note || 0)}
                        <span className="text-xs text-gray-400 ml-1">({item.note || 0})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatutBadge(item.est_publie)}
                        {item.est_en_une && getEnUneBadge(item.est_en_une)}
                      </div>
                      {item.contenu && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
                          "{item.contenu}"
                        </p>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 w-full justify-center">
                        <button
                          onClick={() => navigate(`/temoignages/${item.id}`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => navigate(`/temoignages/${item.id}/modifier`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            setTemoignageToDelete(item);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Quote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun témoignage</h3>
            <p className="text-gray-500">
              {searchTerm || filterPublie !== 'all' || filterEnUne !== 'all'
                ? 'Aucun témoignage ne correspond aux filtres'
                : 'Aucun témoignage enregistré'}
            </p>
            <button
              onClick={() => navigate('/temoignages/nouveau')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Nouveau témoignage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Temoignages;