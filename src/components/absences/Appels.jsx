// src/components/absences/Appels.jsx

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
  School,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  UserCheck,
  UserX,
  ClipboardCheck,
  Users,
  BookOpen,
  Check,
  Timer,
  FileText,
  Layers,
  Download,
  Printer,
  GraduationCap
} from 'lucide-react';

const Appels = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [appels, setAppels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [cours, setCours] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classesByNiveau, setClassesByNiveau] = useState([]);

  // Filtres
  const [niveauId, setNiveauId] = useState('');
  const [classeId, setClasseId] = useState('');
  const [coursId, setCoursId] = useState('');
  const [dateFiltre, setDateFiltre] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    en_cours: 0,
    termines: 0,
    annules: 0,
    total_presents: 0,
    total_absents: 0,
    total_retards: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appelToDelete, setAppelToDelete] = useState(null);
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

        // 1. Charger les niveaux
        const niveauxRes = await axiosInstance.get('/niveaux/', headers);
        let niveauxData = [];
        if (Array.isArray(niveauxRes.data)) {
          niveauxData = niveauxRes.data;
        } else if (niveauxRes.data?.results) {
          niveauxData = niveauxRes.data.results;
        }
        setNiveaux(niveauxData);

        // 2. Charger les classes
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) {
          classesData = classesRes.data;
        } else if (classesRes.data?.results) {
          classesData = classesRes.data.results;
        }
        setClasses(classesData);

        // 3. Charger les cours
        try {
          const coursRes = await axiosInstance.get('/cours/', headers);
          let coursData = [];
          if (Array.isArray(coursRes.data)) {
            coursData = coursRes.data;
          } else if (coursRes.data?.results) {
            coursData = coursRes.data.results;
          }
          setCours(coursData);
        } catch (e) {
          console.warn('Impossible de charger les cours:', e);
        }

        // 4. Charger les enseignants
        try {
          const enseignantRes = await axiosInstance.get('/professeurs/', headers);
          let enseignantData = [];
          if (Array.isArray(enseignantRes.data)) {
            enseignantData = enseignantRes.data;
          } else if (enseignantRes.data?.results) {
            enseignantData = enseignantRes.data.results;
          }
          setEnseignants(enseignantData);
        } catch (e) {
          console.warn('Impossible de charger les enseignants:', e);
        }

        // 5. Charger les appels
        await loadAppels();

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
  // CHARGEMENT DES CLASSES PAR NIVEAU
  // ============================================================
  const loadClassesByNiveau = async (niveauId) => {
    if (!niveauId) {
      setClassesByNiveau([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(`/classes/?niveau=${niveauId}&actif=true`, headers);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }
      setClassesByNiveau(data);
    } catch (err) {
      console.error('Erreur chargement classes par niveau:', err);
      setClassesByNiveau([]);
    }
  };

  // ============================================================
  // CHARGEMENT DES APPELS
  // ============================================================
  const loadAppels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const params = new URLSearchParams();
      if (classeId) params.append('classe', classeId);
      if (coursId) params.append('cours', coursId);
      if (dateFiltre) params.append('date', dateFiltre);
      if (statutFiltre !== 'all') params.append('statut', statutFiltre);

      const url = `/appels/?${params.toString()}`;
      const res = await axiosInstance.get(url, headers);

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      setAppels(data);
      setTotalItems(data.length);
      updateStats(data);

    } catch (err) {
      console.error('❌ Erreur chargement appels:', err);
      if (err.response?.status === 404) {
        setAppels([]);
        setTotalItems(0);
        updateStats([]);
        showMessage('Aucun appel trouvé', 'info');
      } else {
        showMessage('Erreur lors du chargement des appels', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MISE À JOUR DES STATISTIQUES
  // ============================================================
  const updateStats = (data) => {
    const total = data.length || 0;
    const en_cours = data.filter(a => a.statut === 'en_cours').length || 0;
    const termines = data.filter(a => a.statut === 'termine').length || 0;
    const annules = data.filter(a => a.statut === 'annule').length || 0;

    let total_presents = 0;
    let total_absents = 0;
    let total_retards = 0;

    data.forEach(a => {
      if (a.presents) total_presents += a.presents;
      if (a.absents) total_absents += a.absents;
      if (a.retards) total_retards += a.retards;
    });

    setStats({
      total,
      en_cours,
      termines,
      annules,
      total_presents,
      total_absents,
      total_retards
    });
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleNiveauChange = async (e) => {
    const value = e.target.value;
    setNiveauId(value);
    setClasseId('');
    setClassesByNiveau([]);
    if (value) {
      await loadClassesByNiveau(value);
    }
  };

  const handleClasseChange = (e) => {
    const value = e.target.value;
    setClasseId(value);
    setCurrentPage(1);
  };

  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    if (name === 'niveau') {
      handleNiveauChange(e);
    } else if (name === 'classe') {
      setClasseId(value);
      setCurrentPage(1);
    } else if (name === 'cours') {
      setCoursId(value);
      setCurrentPage(1);
    } else if (name === 'date') {
      setDateFiltre(value);
      setCurrentPage(1);
    } else if (name === 'statut') {
      setStatutFiltre(value);
      setCurrentPage(1);
    }
  };

  const handleRefresh = () => {
    loadAppels();
    showMessage('Données actualisées', 'success');
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!appelToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/appels/${appelToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Appel supprimé avec succès', 'success');
      loadAppels();
      setShowDeleteModal(false);
      setAppelToDelete(null);
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
    let filtered = [...appels];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(a =>
        (a.cours_nom || '').toLowerCase().includes(search) ||
        (a.classe_nom || '').toLowerCase().includes(search) ||
        (a.enseignant_nom || '').toLowerCase().includes(search)
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
  }, [searchTerm]);

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

  const formatTime = (time) => {
    if (!time) return '-';
    try {
      return time.substring(0, 5);
    } catch {
      return '-';
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'en_cours': { color: 'bg-yellow-100 text-yellow-800', icon: Timer, label: 'En cours' },
      'termine': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Terminé' },
      'annule': { color: 'bg-red-100 text-red-800', icon: X, label: 'Annulé' }
    };
    const config = map[statut] || map['en_cours'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" /> {config.label}
      </span>
    );
  };

  const getPresenceStats = (appel) => {
    const presents = appel.presents || 0;
    const absents = appel.absents || 0;
    const retards = appel.retards || 0;
    const total = presents + absents + retards || 1;

    return {
      presents,
      absents,
      retards,
      total
    };
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (appels.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Date', 'Cours', 'Classe', 'Enseignant', 'Statut', 'Présents', 'Absents', 'Retards'];
    const rows = appels.map(a => [
      formatDate(a.date),
      a.cours_nom || '-',
      a.classe_nom || '-',
      a.enseignant_nom || '-',
      a.statut || '-',
      a.presents || 0,
      a.absents || 0,
      a.retards || 0
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appels_${new Date().toISOString().split('T')[0]}.csv`;
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
          <p className="mt-4 text-gray-500">Chargement des appels...</p>
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
      {showDeleteModal && appelToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer l'appel du <strong>{formatDate(appelToDelete.date)}</strong> pour <strong>{appelToDelete.cours_nom}</strong> ?
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
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                Gestion des appels
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <button
                onClick={() => navigate('/appels/nouveau')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Nouvel appel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* STATISTIQUES */}
        {appels.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">En cours</p>
              <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.en_cours}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Terminés</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.termines}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Annulés</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.annules}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Présents</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.total_presents}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Absents</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.total_absents}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Retards</p>
              <p className="text-base sm:text-lg font-bold text-orange-500">{stats.total_retards}</p>
            </div>
          </div>
        )}

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Layers className="h-4 w-4 inline mr-1" />
                Niveau
              </label>
              <select
                name="niveau"
                value={niveauId}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map(niveau => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <School className="h-4 w-4 inline mr-1" />
                Classe
              </label>
              <select
                name="classe"
                value={classeId}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!niveauId}
              >
                <option value="">Toutes les classes</option>
                {classesByNiveau.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Cours
              </label>
              <select
                name="cours"
                value={coursId}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les cours</option>
                {cours.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.matiere_nom || 'Sans matière'} - {c.classe_nom || 'Sans classe'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={dateFiltre}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <select
                name="statut"
                value={statutFiltre}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="h-4 w-4 inline mr-1" />
                Recherche
              </label>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={loadAppels}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Filtrer
            </button>
            <button
              onClick={() => {
                setNiveauId('');
                setClasseId('');
                setCoursId('');
                setDateFiltre('');
                setStatutFiltre('all');
                setSearchTerm('');
                setClassesByNiveau([]);
                setAppels([]);
                setStats({ total: 0, en_cours: 0, termines: 0, annules: 0, total_presents: 0, total_absents: 0, total_retards: 0 });
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          </div>
        </div>

        {/* TABLEAU DES APPELS */}
        {appels.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <BookOpen className="h-4 w-4 inline mr-1" />
                      Cours
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                      <School className="h-4 w-4 inline mr-1" />
                      Classe
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                      <User className="h-4 w-4 inline mr-1" />
                      Enseignant
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 hidden lg:table-cell">
                      <Users className="h-4 w-4 inline mr-1" />
                      Présence
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Statut
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const presenceStats = getPresenceStats(item);
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium">{formatDate(item.date)}</span>
                          <span className="text-xs text-gray-400 block">
                            {item.heure_debut ? formatTime(item.heure_debut) : ''} - {item.heure_fin ? formatTime(item.heure_fin) : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">{item.cours_nom || '-'}</span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-500">{item.classe_nom || '-'}</span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-sm text-gray-500">{item.enseignant_nom || '-'}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600 text-sm font-medium">{presenceStats.presents}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-red-600 text-sm font-medium">{presenceStats.absents}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-orange-500 text-sm font-medium">{presenceStats.retards}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatutBadge(item.statut)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/appels/${item.id}`)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => navigate(`/appels/${item.id}/editer`)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title="Modifier"
                              disabled={item.statut === 'termine'}
                            >
                              <Edit className={`h-4 w-4 ${item.statut === 'termine' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'}`} />
                            </button>
                            <button
                              onClick={() => {
                                setAppelToDelete(item);
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
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun appel</h3>
            <p className="text-gray-500">
              {classeId || coursId || dateFiltre || statutFiltre !== 'all' ? 'Aucun appel ne correspond aux filtres' : 'Aucun appel enregistré'}
            </p>
            <button
              onClick={() => navigate('/appels/nouveau')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Nouvel appel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appels;