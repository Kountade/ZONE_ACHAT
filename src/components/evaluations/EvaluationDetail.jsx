// src/components/evaluations/EvaluationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, Loader2, FileText, AlertCircle,
  CheckCircle, X, Calendar, Clock, BookOpen, Users, Tag,
  Hash, TrendingUp, TrendingDown, Award, Eye
} from 'lucide-react';

const EvaluationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState(null);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      const res = await axiosInstance.get(`/evaluations/${id}/`, headers);
      setEvaluation(res.data);

      // Statistiques calculées depuis les données
      const data = res.data;
      setStats({
        nombre_eleves: data.nombre_eleves || 0,
        moyenne: data.moyenne_generale || 0,
        note_min: data.note_min || 0,
        note_max: data.note_max_obtenue || 0,
        coefficient: data.coefficient || 1.0
      });

    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.status === 404) {
        setError('Évaluation non trouvée');
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEvaluation();
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/evaluations/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Évaluation supprimée avec succès', 'success');
      setTimeout(() => navigate('/evaluations'), 1500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des notes sont associées', 'error');
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
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const getStatutBadge = (statut) => {
    const configs = {
      'prevue': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'en_cours': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'terminee': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'annulee': { color: 'bg-red-100 text-red-800', icon: X },
      'reportee': { color: 'bg-orange-100 text-orange-800', icon: Clock }
    };
    const config = configs[statut] || configs['prevue'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit`}>
        <Icon className="w-3.5 h-3.5" /> {statut || 'Prévue'}
      </span>
    );
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error || 'Non trouvé'}</h3>
          <button onClick={() => navigate('/evaluations')} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 mt-1">Voulez-vous supprimer "{evaluation.titre}" ?</p>
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

      {/* EN-TÊTE COMPACT */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/evaluations')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 truncate max-w-[200px] sm:max-w-md">
                {evaluation.titre}
              </h1>
            </div>
            {getStatutBadge(evaluation.statut)}
          </div>
          <div className="flex gap-1.5">
            <Link to={`/evaluations/${id}/modifier`} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Modifier">
              <Edit className="w-4 h-4 text-gray-500" />
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="p-1.5 hover:bg-red-100 rounded-lg" title="Supprimer">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL - 2 COLONNES */}
      <div className="w-full px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          
          {/* COLONNE GAUCHE - Informations */}
          <div className="space-y-3">
            
            {/* Informations générales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Informations
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Titre</span>
                  <span className="font-medium">{evaluation.titre}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Matière</span>
                  <span className="font-medium">{evaluation.matiere_nom || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-medium">{evaluation.niveau_nom || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Période</span>
                  <span className="font-medium">{evaluation.periode_libelle || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {evaluation.type_couleur && (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: evaluation.type_couleur }} />
                    )}
                    {evaluation.type_nom || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Statut</span>
                  {getStatutBadge(evaluation.statut)}
                </div>
              </div>
            </div>

            {/* Description */}
            {evaluation.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{evaluation.description}</p>
              </div>
            )}
          </div>

          {/* COLONNE DROITE - Barème, Stats, Dates */}
          <div className="space-y-3">
            
            {/* Statistiques */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Statistiques
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-600">{stats?.nombre_eleves || 0}</p>
                  <p className="text-[10px] text-gray-500">Élèves</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className={`text-lg font-bold ${(stats?.moyenne || 0) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats?.moyenne || 0).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">Moyenne</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-orange-600">{stats?.note_min?.toFixed(2) || '0.00'}</p>
                  <p className="text-[10px] text-gray-500">Min</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-green-600">{stats?.note_max?.toFixed(2) || '0.00'}</p>
                  <p className="text-[10px] text-gray-500">Max</p>
                </div>
              </div>
            </div>

            {/* Barème */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                Barème
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Coefficient</span>
                  <span className="font-medium">{stats?.coefficient || evaluation.coefficient || 1.0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Note max</span>
                  <span className="font-medium">{evaluation.note_max || 20}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Note min</span>
                  <span className="font-medium">{evaluation.note_min || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Note sur</span>
                  <span className="font-medium">{evaluation.note_sur || 20}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Évaluation</span>
                  <span className="font-medium">{formatDate(evaluation.date_evaluation)}</span>
                </div>
                {evaluation.heure_debut && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Heure</span>
                    <span className="font-medium">
                      {formatTime(evaluation.heure_debut)} - {formatTime(evaluation.heure_fin)}
                    </span>
                  </div>
                )}
                {evaluation.duree && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Durée</span>
                    <span className="font-medium">{evaluation.duree} min</span>
                  </div>
                )}
                {evaluation.date_publication && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Publication</span>
                    <span className="font-medium">{formatDate(evaluation.date_publication)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audit */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span>Créé le</span>
                  <p className="font-medium text-gray-700">
                    {evaluation.date_creation ? new Date(evaluation.date_creation).toLocaleString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <span>Modifié le</span>
                  <p className="font-medium text-gray-700">
                    {evaluation.date_modification ? new Date(evaluation.date_modification).toLocaleString('fr-FR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;