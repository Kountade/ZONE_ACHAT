// src/components/evaluations/SemestreDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, FileText, Printer,
  Calendar, CalendarRange, Clock, Lock, Unlock,
  Users, AlertCircle, CheckCircle, Loader2,
  X, BookOpen, School, User, Gauge,
  Award, TrendingUp, TrendingDown, PieChart,
  Eye, RefreshCw, Plus, Filter, Search,
  ClipboardList, Info, GraduationCap
} from 'lucide-react';

const SemestreDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [periode, setPeriode] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloreModal, setShowCloreModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloturant, setIsCloturant] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('info');

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
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      console.log('🔍 Chargement période ID:', id);

      // 1. Charger la période
      const periodeRes = await axiosInstance.get(`/periodes/${id}/`, headers);
      console.log('✅ Période chargée:', periodeRes.data);
      setPeriode(periodeRes.data);

      // 2. Charger les matières
      try {
        const matieresRes = await axiosInstance.get(`/periodes/${id}/matieres/`, headers);
        setMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : matieresRes.data?.results || []);
      } catch (e) {
        console.warn('Erreur chargement matières:', e);
        setMatieres([]);
      }

      // 3. Charger les évaluations
      try {
        const evalRes = await axiosInstance.get(`/periodes/${id}/evaluations/`, headers);
        setEvaluations(Array.isArray(evalRes.data) ? evalRes.data : evalRes.data?.results || []);
      } catch (e) {
        console.warn('Erreur chargement évaluations:', e);
        setEvaluations([]);
      }

      // 4. Charger le résumé
      try {
        const resumeRes = await axiosInstance.get(`/periodes/${id}/resume/`, headers);
        setResume(resumeRes.data);
      } catch (e) {
        console.warn('Erreur chargement résumé:', e);
        setResume(null);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Période non trouvée');
      } else {
        setError('Erreur lors du chargement');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      setError('ID de période manquant');
      setLoading(false);
    }
  }, [id]);

  // ============================================================
  // CLÔTURER
  // ============================================================
  const handleClore = async () => {
    setIsCloturant(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/periodes/${id}/clore/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période clôturée avec succès', 'success');
      setShowCloreModal(false);
      fetchData();
    } catch (error) {
      console.error('❌ Erreur clôture:', error);
      if (error.response?.data?.error) {
        showNotification(error.response.data.error, 'error');
      } else {
        showNotification('Erreur lors de la clôture', 'error');
      }
    } finally {
      setIsCloturant(false);
    }
  };

  // ============================================================
  // ROUVRIR
  // ============================================================
  const handleRouvrir = async () => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/periodes/${id}/rouvrir/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période réouverte avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('❌ Erreur réouverture:', error);
      showNotification('Erreur lors de la réouverture', 'error');
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/periodes/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Période supprimée avec succès', 'success');
      setTimeout(() => navigate('/periodes'), 1500);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des données sont associées', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const getStatusBadge = () => {
    if (!periode) return null;
    if (periode.est_cloture) {
      return <span className="badge badge-ghost gap-1"><Lock className="w-3 h-3" /> Clôturée</span>;
    }
    if (periode.est_active) {
      return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
    }
    return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> À venir</span>;
  };

  const getStatutBadge = (statut) => {
    const map = {
      terminee: 'badge-success',
      prevue: 'badge-info',
      en_cours: 'badge-warning',
      annulee: 'badge-error',
      reportee: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      terminee: 'Terminée',
      prevue: 'Prévue',
      en_cours: 'En cours',
      annulee: 'Annulée',
      reportee: 'Reportée'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getMentionColor = (mention) => {
    const map = {
      'Très Bien': 'text-green-600 bg-green-100',
      'Bien': 'text-blue-600 bg-blue-100',
      'Assez Bien': 'text-yellow-600 bg-yellow-100',
      'Passable': 'text-orange-600 bg-orange-100',
      'Non Admis': 'text-red-600 bg-red-100'
    };
    return map[mention] || 'text-gray-600 bg-gray-100';
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 animate-pulse">
            Chargement des détails...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-600">{error}</h3>
          <p className="text-gray-500 text-sm">Vérifiez que l'ID est correct.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/periodes')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 inline mr-2" /> Retour
            </button>
            <button onClick={fetchData} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              <RefreshCw className="w-4 h-4 inline mr-2" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - Aucune donnée
  // ============================================================
  if (!periode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center">
          <CalendarRange className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500">Aucune donnée</h3>
          <button onClick={() => navigate('/periodes')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <ArrowLeft className="w-4 h-4 inline mr-2" /> Retour
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 p-4 bg-gray-50 min-h-screen">
      
      {/* NOTIFICATION TOAST */}
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
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
            <div className="bg-red-100 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette période ?</p>
              <p className="font-semibold text-red-600 mt-2 text-lg">{periode.libelle}</p>
              <p className="text-xs text-gray-400 mt-4">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Annuler
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLÔTURE */}
      {showCloreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
            <div className="bg-orange-100 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-orange-600">Clôturer la période</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment clôturer cette période ?</p>
              <p className="font-semibold text-gray-800 mt-2 text-lg">{periode.libelle}</p>
              <p className="text-xs text-yellow-600 mt-4">⚠️ Cette action est réversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100" onClick={() => setShowCloreModal(false)} disabled={isCloturant}>
                Annuler
              </button>
              <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2" onClick={handleClore} disabled={isCloturant}>
                {isCloturant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isCloturant ? 'Clôture...' : 'Clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/periodes')} className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarRange className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                  {periode.libelle}
                  <span className="text-sm font-normal">{getStatusBadge()}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-blue-600">{periode.type_periode}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{periode.annee_libelle}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(periode.date_debut)} - {formatDate(periode.date_fin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-14 lg:ml-0">
            {!periode.est_cloture && (
              <button onClick={() => setShowCloreModal(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4" /> Clôturer
              </button>
            )}
            {periode.est_cloture && (
              <button onClick={handleRouvrir} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
                <Unlock className="w-4 h-4" /> Rouvrir
              </button>
            )}
            <button onClick={() => navigate(`/periodes/${id}/modifier`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button onClick={() => navigate(`/periodes/${id}/pdf`)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Matières</p>
          <p className="text-2xl font-bold text-blue-600">{matieres.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Évaluations</p>
          <p className="text-2xl font-bold text-green-600">{evaluations.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Élèves</p>
          <p className="text-2xl font-bold text-purple-600">{resume?.statistiques?.total_eleves || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Moyenne Générale</p>
          <p className={`text-2xl font-bold ${(resume?.statistiques?.moyenne_generale || 0) >= 12 ? 'text-green-600' : 'text-red-600'}`}>
            {formatNumber(resume?.statistiques?.moyenne_generale || 0)}
          </p>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'info', label: 'Informations', icon: Info },
              { id: 'matieres', label: 'Matières', icon: BookOpen, count: matieres.length },
              { id: 'evaluations', label: 'Évaluations', icon: ClipboardList, count: evaluations.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`badge badge-sm ${activeTab === tab.id ? 'badge-primary' : 'badge-ghost'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          
          {/* ONGLET INFORMATIONS */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-blue-600" />
                  Informations générales
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium">{periode.type_periode}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Libellé</span>
                    <span className="font-medium">{periode.libelle}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Année scolaire</span>
                    <span className="font-medium text-blue-600">{periode.annee_libelle}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Date de début</span>
                    <span className="font-medium">{formatDate(periode.date_debut)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Date de fin</span>
                    <span className="font-medium">{formatDate(periode.date_fin)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Durée</span>
                    <span className="font-medium">
                      {periode.date_debut && periode.date_fin ? 
                        `${Math.ceil((new Date(periode.date_fin) - new Date(periode.date_debut)) / (1000 * 60 * 60 * 24))} jours` : 
                        '-'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Statut</span>
                    <span>{getStatusBadge()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  Statistiques
                </h3>
                {resume ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Total évaluations</span>
                      <span className="font-medium">{resume.statistiques?.total_evaluations || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Total notes</span>
                      <span className="font-medium">{resume.statistiques?.total_notes || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Total élèves</span>
                      <span className="font-medium">{resume.statistiques?.total_eleves || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Moyenne générale</span>
                      <span className={`font-medium ${(resume.statistiques?.moyenne_generale || 0) >= 12 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(resume.statistiques?.moyenne_generale || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Taux de réussite</span>
                      <span className={`font-medium ${(resume.statistiques?.taux_reussite || 0) >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(resume.statistiques?.taux_reussite || 0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune statistique disponible</p>
                )}
              </div>

              {/* Mentions */}
              {resume?.mentions && (
                <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-blue-600" />
                    Répartition des mentions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{resume.mentions.très_bien || 0}</p>
                      <p className="text-xs text-green-600">Très Bien</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{resume.mentions.bien || 0}</p>
                      <p className="text-xs text-blue-600">Bien</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700">{resume.mentions.assez_bien || 0}</p>
                      <p className="text-xs text-yellow-600">Assez Bien</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-700">{resume.mentions.passable || 0}</p>
                      <p className="text-xs text-orange-600">Passable</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{resume.mentions.non_admis || 0}</p>
                      <p className="text-xs text-red-600">Non Admis</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Audit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Créée le</span>
                    <span className="font-medium">{formatDateTime(periode.date_creation)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Modifiée le</span>
                    <span className="font-medium">{formatDateTime(periode.date_modification)}</span>
                  </div>
                  {periode.est_cloture && periode.date_cloture && (
                    <div className="flex justify-between sm:col-span-2">
                      <span className="text-gray-500">Clôturée le</span>
                      <span className="font-medium">{formatDate(periode.date_cloture)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ONGLET MATIÈRES */}
          {activeTab === 'matieres' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Matières ({matieres.length})</h2>
                </div>
                <button onClick={() => navigate(`/matieres-periodes?periode=${id}`)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Gérer
                </button>
              </div>

              {matieres.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aucune matière associée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matieres.map(m => (
                    <div key={m.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <p className="font-semibold text-gray-800">{m.matiere_nom}</p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{m.niveau_nom}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${m.est_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                          {m.est_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span>Coef: <strong className="text-gray-700">{m.coefficient}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ONGLET ÉVALUATIONS */}
          {activeTab === 'evaluations' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Évaluations ({evaluations.length})</h2>
                </div>
                <button onClick={() => navigate(`/evaluations?periode=${id}`)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              {evaluations.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aucune évaluation pour cette période</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Matière</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Statut</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {evaluations.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{e.titre}</td>
                          <td className="px-4 py-3 text-sm hidden md:table-cell">{e.matiere_nom}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(e.date_evaluation)}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`badge ${getStatutBadge(e.statut)}`}>
                              {getStatutLabel(e.statut)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => navigate(`/evaluations/${e.id}`)} className="p-1 hover:bg-gray-100 rounded-lg text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SemestreDetail;