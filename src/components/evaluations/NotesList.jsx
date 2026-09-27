// src/components/evaluations/NotesList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus,
  Search,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Loader2,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  User,
  IdCard,
  Gauge,
  Download,
  BarChart3,
  UserX,
  Check,
  UserRound,
  ClipboardList,
  Printer
} from 'lucide-react';

const NotesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [classes, setClasses] = useState([]);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [classeFilter, setClasseFilter] = useState('all');
  const [evaluationFilter, setEvaluationFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    notesSaisies: 0,
    notesManquantes: 0,
    moyenne: 0,
    max: 0,
    min: 0,
    presents: 0,
    absents: 0
  });

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

      // 1. Charger les classes
      try {
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) {
          classesData = classesRes.data;
        } else if (classesRes.data?.results) {
          classesData = classesRes.data.results;
        }
        setClasses(classesData);
      } catch (e) {
        console.warn('Impossible de charger les classes:', e);
      }

      // 2. Charger les évaluations
      try {
        const evalRes = await axiosInstance.get('/evaluations/', headers);
        let evalData = [];
        if (Array.isArray(evalRes.data)) {
          evalData = evalRes.data;
        } else if (evalRes.data?.results) {
          evalData = evalRes.data.results;
        }
        setEvaluations(evalData);
      } catch (e) {
        console.warn('Impossible de charger les évaluations:', e);
      }

      // 3. Charger les notes
      await fetchNotes();

    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de chargement des données');
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ CHARGEMENT DES NOTES - CORRIGÉ
  // ============================================================
  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      let url = '/notes/';
      const params = new URLSearchParams();

      if (evaluationFilter !== 'all') {
        params.append('evaluation', evaluationFilter);
      }
      if (classeFilter !== 'all') {
        params.append('classe', classeFilter);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      console.log('🔍 Chargement des notes avec URL:', url);

      const res = await axiosInstance.get(url, headers);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }
      
      console.log(`📊 ${data.length} notes chargées`);
      setNotes(data);
      setTotalItems(data.length);
      updateStats(data);

    } catch (err) {
      console.error('❌ Erreur chargement notes:', err);
      if (err.response?.status === 404) {
        setNotes([]);
        setTotalItems(0);
        updateStats([]);
      } else if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur chargement des notes', 'error');
      }
    }
  };

  // ============================================================
  // ✅ RAFRAÎCHIR COMPLET - CORRIGÉ
  // ============================================================
  const handleRefresh = async () => {
    showNotification('Actualisation en cours...', 'info');
    await fetchData();
    showNotification('Données actualisées', 'success');
  };

  // ============================================================
  // MISE À JOUR DES STATISTIQUES
  // ============================================================
  const updateStats = (notesData) => {
    const notesValides = notesData.filter(n => n.note !== null && n.note !== '' && n.note !== undefined);
    const total = notesData.length;
    const notesSaisies = notesValides.length;
    const notesManquantes = total - notesSaisies;
    const presents = notesData.filter(n => n.est_present === true).length;
    const absents = notesData.filter(n => n.est_absente === true).length;

    let moyenne = 0;
    let max = 0;
    let min = 0;
    
    if (notesValides.length > 0) {
      const notesValues = notesValides.map(n => parseFloat(n.note) || 0);
      const sum = notesValues.reduce((a, b) => a + b, 0);
      moyenne = sum / notesValues.length;
      max = Math.max(...notesValues);
      min = Math.min(...notesValues);
    }

    setStats({
      total: total || 0,
      notesSaisies: notesSaisies || 0,
      notesManquantes: notesManquantes || 0,
      moyenne: moyenne || 0,
      max: max || 0,
      min: min || 0,
      presents: presents || 0,
      absents: absents || 0
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (evaluationFilter !== 'all' || classeFilter !== 'all') {
      fetchNotes();
    }
  }, [evaluationFilter, classeFilter]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/notes/${noteToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Note supprimée avec succès', 'success');
      await fetchNotes();
      setShowDeleteModal(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
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
  const getFilteredNotes = () => {
    let filtered = [...notes];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(n =>
        (n.eleve_nom || '').toLowerCase().includes(search) ||
        (n.evaluation_titre || '').toLowerCase().includes(search) ||
        (n.matiere_nom || '').toLowerCase().includes(search)
      );
    }

    if (statutFilter === 'present') {
      filtered = filtered.filter(n => n.est_present === true);
    } else if (statutFilter === 'absent') {
      filtered = filtered.filter(n => n.est_absente === true);
    }

    return filtered;
  };

  const filteredNotes = getFilteredNotes();
  const totalFiltered = filteredNotes.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedNotes = filteredNotes.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter]);

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (notes.length === 0) return;

    const headers = ['Élève', 'Matricule', 'Évaluation', 'Matière', 'Note', 'Note /20', 'Observation', 'Présent', 'Absent'];
    const rows = notes.map(n => [
      n.eleve_nom || '-',
      n.eleve_matricule || '-',
      n.evaluation_titre || '-',
      n.matiere_nom || '-',
      n.note || '',
      n.note_sur_20 || '',
      n.observation || '',
      n.est_present ? 'Oui' : 'Non',
      n.est_absente ? 'Oui' : 'Non'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getNoteColor = (note, noteSur = 20) => {
    if (note === null || note === undefined || note === '') return 'text-gray-500';
    const val = parseFloat(note);
    if (isNaN(val)) return 'text-gray-500';
    const max = parseFloat(noteSur) || 20;
    if (val >= max * 0.8) return 'text-green-600 font-bold';
    if (val >= max * 0.5) return 'text-orange-500 font-bold';
    return 'text-red-600 font-bold';
  };

  const getStatutBadge = (estPresent, estAbsent) => {
    if (estAbsent) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
          <UserX className="h-3 w-3" />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
        <Check className="h-3 w-3" />
        Présent
      </span>
    );
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Chargement des notes...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-600">{error}</h3>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* NOTIFICATION */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-md flex items-center justify-between gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
            : notification.type === 'info'
            ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
            : 'bg-red-100 text-red-800 border-l-4 border-red-500'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : notification.type === 'info' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer la note de <strong>{noteToDelete.eleve_nom}</strong> ?
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Notes des élèves</h1>
              <p className="text-sm text-gray-500">{totalItems} note(s) au total</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ✅ BOUTON ACTUALISER CORRIGÉ */}
            <button 
              onClick={handleRefresh} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/notes/saisie')} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
            >
              <Plus className="h-4 w-4" /> Saisie rapide
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
          <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Notés</p>
          <p className="text-base sm:text-lg font-bold text-green-600">{stats.notesSaisies}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Non notés</p>
          <p className="text-base sm:text-lg font-bold text-red-600">{stats.notesManquantes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Présents</p>
          <p className="text-base sm:text-lg font-bold text-green-600">{stats.presents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Absents</p>
          <p className="text-base sm:text-lg font-bold text-red-600">{stats.absents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Moyenne</p>
          <p className="text-base sm:text-lg font-bold text-blue-600">{stats.moyenne.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center hover:shadow-md transition">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Min/Max</p>
          <p className="text-base sm:text-lg font-bold text-purple-600">{stats.min.toFixed(1)}/{stats.max.toFixed(1)}</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par élève, évaluation, matière..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
            {(classeFilter !== 'all' || evaluationFilter !== 'all' || statutFilter !== 'all') && (
              <button
                onClick={() => {
                  setClasseFilter('all');
                  setEvaluationFilter('all');
                  setStatutFilter('all');
                  // Recharger les notes après avoir effacé les filtres
                  setTimeout(() => fetchNotes(), 100);
                }}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Effacer
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Classe</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={classeFilter}
                onChange={(e) => setClasseFilter(e.target.value)}
              >
                <option value="all">Toutes les classes</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>{classe.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Évaluation</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={evaluationFilter}
                onChange={(e) => setEvaluationFilter(e.target.value)}
              >
                <option value="all">Toutes les évaluations</option>
                {evaluations.map(evalItem => (
                  <option key={evalItem.id} value={evalItem.id}>
                    {evalItem.titre} - {evalItem.matiere_nom || 'Sans matière'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Statut</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="present">Présents</option>
                <option value="absent">Absents</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  <User className="h-4 w-4 inline mr-1" /> Élève
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                  <IdCard className="h-4 w-4 inline mr-1" /> Matricule
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                  <ClipboardList className="h-4 w-4 inline mr-1" /> Évaluation
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">
                  <BookOpen className="h-4 w-4 inline mr-1" /> Matière
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                  <Gauge className="h-4 w-4 inline mr-1" /> Note
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 hidden sm:table-cell">
                  /20
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                  Statut
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-500">
                        {searchTerm || classeFilter !== 'all' || evaluationFilter !== 'all' || statutFilter !== 'all'
                          ? 'Aucune note ne correspond aux filtres'
                          : 'Aucune note trouvée'}
                      </p>
                      <button 
                        onClick={() => navigate('/notes/saisie')} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Saisir des notes
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedNotes.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-800">{item.eleve_nom || 'Inconnu'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{item.eleve_matricule || '-'}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-sm">{item.evaluation_titre || '-'}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-sm">{item.matiere_nom || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm ${getNoteColor(item.note, item.note_sur)}`}>
                        {item.note !== null && item.note !== '' ? item.note : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className={`text-sm ${getNoteColor(item.note_sur_20, 20)}`}>
                        {item.note_sur_20 !== null ? item.note_sur_20 : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatutBadge(item.est_present, item.est_absente)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Link
                          to={`/admin/evaluations/${item.evaluation}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title="Voir l'évaluation"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Link>
                        <Link
                          to={`/admin/evaluations/${item.evaluation}/notes`}
                          className="p-1.5 hover:bg-green-100 rounded-lg transition"
                          title="Gérer les notes"
                        >
                          <BarChart3 className="h-4 w-4 text-green-500" />
                        </Link>
                        <button
                          onClick={() => {
                            setNoteToDelete(item);
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalFiltered > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {startIndex + 1} - {endIndex} sur {totalFiltered} note(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <select
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <button
                onClick={exportCSV}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1 text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1 text-sm"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList;