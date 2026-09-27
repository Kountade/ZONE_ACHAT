// src/components/absences/AppelDetail.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

// Imports Lucide React - Version simplifiée
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  School,
  User,
  UserCheck,
  UserX,
  Users,
  FileText,
  Printer,
  Download,
  RefreshCw,
  GraduationCap,
  IdCard,
  Check,
  Timer,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Info,
  ClipboardCheck
} from 'lucide-react';

const AppelDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [appel, setAppel] = useState(null);
  const [details, setDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAbsents, setShowAbsents] = useState(false);
  const [showPresents, setShowPresents] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    presents: 0,
    absents: 0,
    retards: 0,
    excuses: 0
  });

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    const fetchAppel = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        const res = await axiosInstance.get(`/appels/${id}/`, headers);
        const data = res.data;
        
        setAppel(data);
        
        // Récupérer les détails
        if (data.details) {
          setDetails(data.details);
          updateStats(data.details);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        if (err.response?.status === 404) {
          setError('Appel non trouvé');
        } else if (err.response?.status === 401) {
          showMessage('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Erreur de chargement');
          showMessage('Erreur de chargement de l\'appel', 'error');
        }
        setLoading(false);
      }
    };

    if (id) {
      fetchAppel();
    }
  }, [id, navigate]);

  // ============================================================
  // MISE À JOUR DES STATISTIQUES
  // ============================================================
  const updateStats = (detailsList) => {
    const total = detailsList.length || 0;
    const presents = detailsList.filter(d => d.presence === 'present').length || 0;
    const absents = detailsList.filter(d => d.presence === 'absent').length || 0;
    const retards = detailsList.filter(d => d.presence === 'retard').length || 0;
    const excuses = detailsList.filter(d => d.presence === 'excuse').length || 0;

    setStats({
      total,
      presents,
      absents,
      retards,
      excuses
    });
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/appels/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showMessage('Appel supprimé avec succès', 'success');
      setTimeout(() => navigate('/appels'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (details.length === 0) return;

    const headers = ['N°', 'Élève', 'Matricule', 'Présence', 'Motif absence', 'Heure arrivée'];
    const rows = details.map((detail, index) => {
      const presenceLabels = {
        present: 'Présent',
        absent: 'Absent',
        retard: 'Retard',
        excuse: 'Excusé'
      };
      return [
        index + 1,
        detail.eleve_nom || 'Inconnu',
        detail.eleve_matricule || '-',
        presenceLabels[detail.presence] || detail.presence,
        detail.motif_absence || '',
        detail.heure_arrivee || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appel_${appel?.date || 'appel'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // FILTRES ET PAGINATION
  // ============================================================
  const getFilteredDetails = () => {
    let filtered = [...details];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d =>
        (d.eleve_nom || '').toLowerCase().includes(search) ||
        (d.eleve_matricule || '').toLowerCase().includes(search)
      );
    }

    if (showAbsents) {
      filtered = filtered.filter(d => d.presence === 'absent');
    }

    if (showPresents) {
      filtered = filtered.filter(d => d.presence === 'present');
    }

    return filtered;
  };

  const filteredDetails = getFilteredDetails();
  const totalFiltered = filteredDetails.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedDetails = filteredDetails.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showAbsents, showPresents]);

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

  const getPresenceBadge = (presence) => {
    const map = {
      'present': { color: 'bg-green-100 text-green-800', icon: Check, label: 'Présent' },
      'absent': { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Absent' },
      'retard': { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Retard' },
      'excuse': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle2, label: 'Excusé' }
    };
    const config = map[presence] || map['present'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" /> {config.label}
      </span>
    );
  };

  const getPresenceColor = (presence) => {
    const map = {
      'present': 'text-green-600',
      'absent': 'text-red-600',
      'retard': 'text-orange-500',
      'excuse': 'text-purple-600'
    };
    return map[presence] || 'text-gray-500';
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
  if (error || !appel) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">{error || 'Appel non trouvé'}</h3>
          <button
            onClick={() => navigate('/appels')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour à la liste
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
              <p className="text-gray-600 mt-2">
                Voulez-vous supprimer l'appel du <strong>{formatDate(appel.date)}</strong> ?
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
                onClick={() => navigate('/appels')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                Détails de l'appel
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
                disabled={details.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              {appel.statut !== 'termine' && (
                <button
                  onClick={() => navigate(`/appels/${id}/editer`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* CARTE D'INFORMATIONS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Cours</h3>
              <p className="text-lg font-semibold text-gray-800">{appel.cours_nom || 'Non défini'}</p>
              <p className="text-sm text-gray-500">{appel.classe_nom || 'Sans classe'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date et heure</h3>
              <p className="text-lg font-semibold text-gray-800">{formatDate(appel.date)}</p>
              <p className="text-sm text-gray-500">
                {appel.heure_debut ? formatTime(appel.heure_debut) : ''} - {appel.heure_fin ? formatTime(appel.heure_fin) : ''}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Enseignant</h3>
              <p className="text-lg font-semibold text-gray-800">{appel.enseignant_nom || 'Non assigné'}</p>
              <div className="mt-1">{getStatutBadge(appel.statut)}</div>
            </div>
          </div>
          {appel.observations && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Observations</h3>
              <p className="text-sm text-gray-700">{appel.observations}</p>
            </div>
          )}
        </div>

        {/* STATISTIQUES */}
        {details.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Présents</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.presents}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Absents</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.absents}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Retards</p>
              <p className="text-base sm:text-lg font-bold text-orange-500">{stats.retards}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Excusés</p>
              <p className="text-base sm:text-lg font-bold text-purple-600">{stats.excuses}</p>
            </div>
          </div>
        )}

        {/* TABLEAU DES ÉLÈVES */}
        {details.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Barre d'outils */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  {totalFiltered} élève(s)
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={showAbsents}
                    onChange={(e) => setShowAbsents(e.target.checked)}
                    className="rounded"
                  />
                  Absents
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={showPresents}
                    onChange={(e) => setShowPresents(e.target.checked)}
                    className="rounded"
                  />
                  Présents
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Type: {appel.type_appel || 'Cours'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <Info className="h-3 w-3 inline mr-1" />
                      N°
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <GraduationCap className="h-3 w-3 inline mr-1" />
                      Élève
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <IdCard className="h-3 w-3 inline mr-1" />
                      Matricule
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      <UserCheck className="h-3 w-3 inline mr-1" />
                      Présence
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Motif
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 hidden lg:table-cell">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Arrivée
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDetails.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        Aucun élève ne correspond aux filtres
                      </td>
                    </tr>
                  ) : (
                    paginatedDetails.map((detail, index) => {
                      const presenceColor = getPresenceColor(detail.presence);
                      const isAbsent = detail.presence === 'absent';

                      return (
                        <tr key={detail.id || index} className={`border-t hover:bg-gray-50 transition ${isAbsent ? 'bg-gray-50' : ''}`}>
                          <td className="px-4 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            {detail.eleve_nom || 'Inconnu'}
                            {isAbsent && (
                              <span className="text-xs text-red-500 ml-1">(Absent)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{detail.eleve_matricule || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-medium ${presenceColor}`}>
                              {getPresenceBadge(detail.presence)}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-gray-500">
                              {detail.motif_absence || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <span className="text-sm text-gray-500">
                              {detail.heure_arrivee || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFiltered > itemsPerPage && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {startIndex + 1} - {endIndex} sur {totalFiltered}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 transition disabled:opacity-50"
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
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun élève</h3>
            <p className="text-gray-500">Aucun élève enregistré pour cet appel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppelDetail;