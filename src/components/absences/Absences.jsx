// src/components/absences/Absences.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

// Imports Lucide React - Version simplifiée et testée
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
  UserX,
  FileCheck
} from 'lucide-react';

const Absences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [absences, setAbsences] = useState([]);
  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [filtres, setFiltres] = useState({
    classe_id: '',
    eleve_id: '',
    date_debut: '',
    date_fin: '',
    statut: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    justifiees: 0,
    non_justifiees: 0,
    en_attente: 0,
    refusees: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
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

        // Charger les classes
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) {
          classesData = classesRes.data;
        } else if (classesRes.data?.results) {
          classesData = classesRes.data.results;
        }
        setClasses(classesData);

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
    if (!filtres.classe_id && !filtres.eleve_id) {
      setAbsences([]);
      setTotalItems(0);
      updateStats([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const params = new URLSearchParams();
      if (filtres.classe_id) params.append('classe', filtres.classe_id);
      if (filtres.eleve_id) params.append('eleve', filtres.eleve_id);
      if (filtres.date_debut) params.append('date_debut', filtres.date_debut);
      if (filtres.date_fin) params.append('date_fin', filtres.date_fin);
      if (filtres.statut !== 'all') params.append('statut', filtres.statut);

      const url = `/absences-eleves/?${params.toString()}`;
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
      console.error('❌ Erreur chargement absences:', err);
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
  // CHARGEMENT DES ÉLÈVES PAR CLASSE
  // ============================================================
  const loadElevesByClasse = async (classeId) => {
    if (!classeId) {
      setEleves([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(`/eleves/?classe=${classeId}&statut=actif`, headers);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      const classeIdInt = parseInt(classeId);
      const elevesFiltres = data.filter(e => {
        if (!e.classe) return false;
        return parseInt(e.classe) === classeIdInt;
      });

      setEleves(elevesFiltres);
    } catch (err) {
      console.error('❌ Erreur chargement élèves:', err);
      setEleves([]);
    }
  };

  // ============================================================
  // MISE À JOUR DES STATISTIQUES
  // ============================================================
  const updateStats = (data) => {
    setStats({
      total: data.length || 0,
      justifiees: data.filter(a => a.statut === 'justifiee').length || 0,
      non_justifiees: data.filter(a => a.statut === 'non_justifiee').length || 0,
      en_attente: data.filter(a => a.statut === 'en_attente').length || 0,
      refusees: data.filter(a => a.statut === 'refusee').length || 0
    });
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setFiltres(prev => ({ ...prev, classe_id: value, eleve_id: '' }));
    if (value) {
      await loadElevesByClasse(value);
    } else {
      setEleves([]);
    }
    setCurrentPage(1);
  };

  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    setFiltres(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    if (filtres.classe_id || filtres.eleve_id) {
      loadAbsences();
      showMessage('Données actualisées', 'success');
    } else {
      showMessage('Veuillez d\'abord sélectionner une classe ou un élève', 'info');
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
      await axiosInstance.delete(`/absences-eleves/${absenceToDelete.id}/`, {
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
        (a.eleve_nom || '').toLowerCase().includes(search) ||
        (a.eleve_matricule || '').toLowerCase().includes(search)
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
      'en_attente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      'justifiee': { color: 'bg-green-100 text-green-800', icon: FileCheck, label: 'Justifiée' },
      'non_justifiee': { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Non justifiée' },
      'refusee': { color: 'bg-gray-100 text-gray-800', icon: X, label: 'Refusée' }
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
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
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
                Voulez-vous supprimer l'absence de <strong>{absenceToDelete.eleve_nom}</strong> ?
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
                <UserX className="h-6 w-6 text-red-500" />
                Gestion des absences
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
                onClick={() => navigate('/absences/nouveau')}
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
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Justifiées</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.justifiees}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Non justifiées</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.non_justifiees}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">En attente</p>
              <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.en_attente}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Refusées</p>
              <p className="text-base sm:text-lg font-bold text-gray-600">{stats.refusees}</p>
            </div>
          </div>
        )}

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <School className="h-4 w-4 inline mr-1" />
                Classe
              </label>
              <select
                name="classe_id"
                value={filtres.classe_id}
                onChange={handleClasseChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Élève
              </label>
              <select
                name="eleve_id"
                value={filtres.eleve_id}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!filtres.classe_id}
              >
                <option value="">Tous les élèves</option>
                {eleves.map(eleve => (
                  <option key={eleve.id} value={eleve.id}>
                    {eleve.nom_complet || eleve.nom || eleve.prenom}
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
                value={filtres.date_debut}
                onChange={handleFiltreChange}
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
                value={filtres.date_fin}
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
                value={filtres.statut}
                onChange={handleFiltreChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="justifiee">Justifiée</option>
                <option value="non_justifiee">Non justifiée</option>
                <option value="refusee">Refusée</option>
              </select>
            </div>

          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={loadAbsences}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              disabled={!filtres.classe_id && !filtres.eleve_id}
            >
              <Search className="h-4 w-4" />
              Filtrer
            </button>
            <button
              onClick={() => {
                setFiltres({ classe_id: '', eleve_id: '', date_debut: '', date_fin: '', statut: 'all' });
                setEleves([]);
                setAbsences([]);
                setStats({ total: 0, justifiees: 0, non_justifiees: 0, en_attente: 0, refusees: 0 });
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
                      Élève
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                      <IdCard className="h-4 w-4 inline mr-1" />
                      Matricule
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Heure
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Statut
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">
                      Motif
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
                        <span className="font-medium text-gray-800">{item.eleve_nom || 'Inconnu'}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{item.eleve_matricule || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{formatDate(item.date_absence)}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm">
                          {item.heure_debut ? `${formatTime(item.heure_debut)} - ${formatTime(item.heure_fin)}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatutBadge(item.statut)}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500 truncate block max-w-[150px]">
                          {item.motif || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/absences/${item.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/absences/${item.id}/modifier`)}
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
              {filtres.classe_id || filtres.eleve_id ? 'Aucune absence ne correspond aux filtres' : 'Sélectionnez une classe ou un élève pour voir les absences'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Absences;