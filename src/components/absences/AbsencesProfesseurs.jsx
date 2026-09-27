// src/components/absences/AbsencesProfesseurs.jsx

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
  GraduationCap,
  UserCog,
  Briefcase,
  Building2
} from 'lucide-react';

const AbsencesProfesseurs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [absences, setAbsences] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [typesAbsence, setTypesAbsence] = useState([]);
  const [statutFiltre, setStatutFiltre] = useState('all');
  const [professeurId, setProfesseurId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    approuvees: 0,
    refusees: 0,
    justifiees: 0,
    non_justifiees: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
  const [showApprouverModal, setShowApprouverModal] = useState(false);
  const [absenceToApprouver, setAbsenceToApprouver] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

        // 1. Charger les professeurs
        const profRes = await axiosInstance.get('/professeurs/', headers);
        let profData = [];
        if (Array.isArray(profRes.data)) {
          profData = profRes.data;
        } else if (profRes.data?.results) {
          profData = profRes.data.results;
        }
        setProfesseurs(profData);

        // 2. Charger les types d'absence
        try {
          const typesRes = await axiosInstance.get('/types-absence/', headers);
          let typesData = [];
          if (Array.isArray(typesRes.data)) {
            typesData = typesRes.data;
          } else if (typesRes.data?.results) {
            typesData = typesRes.data.results;
          }
          setTypesAbsence(typesData);
        } catch (e) {
          console.warn('Impossible de charger les types d\'absence:', e);
        }

        // 3. Charger les absences
        await loadAbsences();

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
  // CHARGEMENT DES ABSENCES
  // ============================================================
  const loadAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const params = new URLSearchParams();
      if (professeurId) params.append('professeur', professeurId);
      if (dateDebut) params.append('date_debut', dateDebut);
      if (dateFin) params.append('date_fin', dateFin);
      if (statutFiltre !== 'all') params.append('statut', statutFiltre);

      const url = `/absences-professeurs/?${params.toString()}`;
      const res = await axiosInstance.get(url, headers);

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      setAbsences(data);
      setTotalItems(data.length);
      updateStats(data);

    } catch (err) {
      console.error('❌ Erreur chargement absences professeurs:', err);
      if (err.response?.status === 404) {
        setAbsences([]);
        setTotalItems(0);
        updateStats([]);
        showMessage('Aucune absence trouvée', 'info');
      } else {
        showMessage('Erreur lors du chargement des absences', 'error');
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
    const en_attente = data.filter(a => a.statut === 'en_attente').length || 0;
    const approuvees = data.filter(a => a.statut === 'approuvee').length || 0;
    const refusees = data.filter(a => a.statut === 'refusee').length || 0;
    
    // Compter les justifiées et non justifiées (si disponibles)
    let justifiees = 0;
    let non_justifiees = 0;
    data.forEach(a => {
      if (a.type_absence?.est_justifie) {
        justifiees++;
      } else if (a.type_absence) {
        non_justifiees++;
      }
    });

    setStats({
      total,
      en_attente,
      approuvees,
      refusees,
      justifiees,
      non_justifiees
    });
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleProfesseurChange = (e) => {
    setProfesseurId(e.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date_debut') setDateDebut(value);
    if (name === 'date_fin') setDateFin(value);
    setCurrentPage(1);
  };

  const handleStatutChange = (e) => {
    setStatutFiltre(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadAbsences();
    showMessage('Données actualisées', 'success');
  };

  // ============================================================
  // APPROUVER / REFUSER
  // ============================================================
  const handleApprouver = async () => {
    if (!absenceToApprouver) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/absences-professeurs/${absenceToApprouver.id}/approuver/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Absence approuvée avec succès', 'success');
      loadAbsences();
      setShowApprouverModal(false);
      setAbsenceToApprouver(null);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('Erreur lors de l\'approbation', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefuser = async (id) => {
    if (!window.confirm('Voulez-vous vraiment refuser cette absence ?')) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/absences-professeurs/${id}/refuser/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Absence refusée', 'success');
      loadAbsences();
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('Erreur lors du refus', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!absenceToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/absences-professeurs/${absenceToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Absence supprimée avec succès', 'success');
      loadAbsences();
      setShowDeleteModal(false);
      setAbsenceToDelete(null);
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
    let filtered = [...absences];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(a =>
        (a.professeur_nom || '').toLowerCase().includes(search) ||
        (a.type_nom || '').toLowerCase().includes(search) ||
        (a.motif || '').toLowerCase().includes(search)
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
      'en_attente': { color: 'bg-yellow-100 text-yellow-800', icon: Timer, label: 'En attente' },
      'approuvee': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approuvée' },
      'refusee': { color: 'bg-red-100 text-red-800', icon: X, label: 'Refusée' }
    };
    const config = map[statut] || map['en_attente'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" /> {config.label}
      </span>
    );
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (absences.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Professeur', 'Date', 'Heure début', 'Heure fin', 'Type', 'Statut', 'Motif'];
    const rows = absences.map(a => [
      a.professeur_nom || '-',
      formatDate(a.date_absence),
      a.heure_debut ? formatTime(a.heure_debut) : '-',
      a.heure_fin ? formatTime(a.heure_fin) : '-',
      a.type_nom || '-',
      a.statut || '-',
      a.motif || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `absences_professeurs_${new Date().toISOString().split('T')[0]}.csv`;
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
          <p className="mt-4 text-gray-500">Chargement des absences...</p>
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
      {showDeleteModal && absenceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer l'absence de <strong>{absenceToDelete.professeur_nom}</strong> ?
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

      {/* MODAL APPROBATION */}
      {showApprouverModal && absenceToApprouver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Approuver l'absence</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous approuver l'absence de <strong>{absenceToApprouver.professeur_nom}</strong> ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Date: {formatDate(absenceToApprouver.date_absence)}
              </p>
              <p className="text-sm text-gray-500">
                Motif: {absenceToApprouver.motif || 'Non spécifié'}
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={() => {
                  setShowApprouverModal(false);
                  setAbsenceToApprouver(null);
                }}
                disabled={isProcessing}
              >
                Annuler
              </button>
              <button
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                onClick={handleApprouver}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isProcessing ? 'Traitement...' : 'Approuver'}
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
                <UserCog className="h-6 w-6 text-blue-600" />
                Absences des professeurs
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
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={absences.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => navigate('/absences-professeurs/nouveau')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Nouvelle absence
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* STATISTIQUES */}
        {absences.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">En attente</p>
              <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.en_attente}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Approuvées</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.approuvees}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Refusées</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.refusees}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Justifiées</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.justifiees}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Non justifiées</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.non_justifiees}</p>
            </div>
          </div>
        )}

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserCog className="h-4 w-4 inline mr-1" />
                Professeur
              </label>
              <select
                value={professeurId}
                onChange={handleProfesseurChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les professeurs</option>
                {professeurs.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nom_complet || prof.nom || prof.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date début
              </label>
              <input
                type="date"
                name="date_debut"
                value={dateDebut}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date fin
              </label>
              <input
                type="date"
                name="date_fin"
                value={dateFin}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <select
                value={statutFiltre}
                onChange={handleStatutChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="approuvee">Approuvée</option>
                <option value="refusee">Refusée</option>
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
              onClick={loadAbsences}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Filtrer
            </button>
            <button
              onClick={() => {
                setProfesseurId('');
                setDateDebut('');
                setDateFin('');
                setStatutFiltre('all');
                setSearchTerm('');
                setAbsences([]);
                setStats({ total: 0, en_attente: 0, approuvees: 0, refusees: 0, justifiees: 0, non_justifiees: 0 });
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          </div>
        </div>

        {/* TABLEAU DES ABSENCES */}
        {absences.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <User className="h-4 w-4 inline mr-1" />
                      Professeur
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Heure
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Type
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">
                      Motif
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
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">{item.professeur_nom || 'Inconnu'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{formatDate(item.date_absence)}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-sm">
                          {item.heure_debut ? formatTime(item.heure_debut) : ''} - {item.heure_fin ? formatTime(item.heure_fin) : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500">{item.type_nom || '-'}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500 truncate block max-w-[150px]">
                          {item.motif || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatutBadge(item.statut)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {item.statut === 'en_attente' && (
                            <button
                              onClick={() => {
                                setAbsenceToApprouver(item);
                                setShowApprouverModal(true);
                              }}
                              className="p-1.5 hover:bg-green-100 rounded-lg transition"
                              title="Approuver"
                              disabled={isProcessing}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </button>
                          )}
                          {item.statut === 'en_attente' && (
                            <button
                              onClick={() => handleRefuser(item.id)}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition"
                              title="Refuser"
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/absences-professeurs/${item.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/absences-professeurs/${item.id}/modifier`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => {
                              setAbsenceToDelete(item);
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
            <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucune absence</h3>
            <p className="text-gray-500">
              {professeurId || dateDebut || dateFin || statutFiltre !== 'all' ? 'Aucune absence ne correspond aux filtres' : 'Aucune absence de professeur enregistrée'}
            </p>
            <button
              onClick={() => navigate('/absences-professeurs/nouveau')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Nouvelle absence
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsencesProfesseurs;