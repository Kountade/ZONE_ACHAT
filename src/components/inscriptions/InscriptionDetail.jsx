// src/components/inscriptions/InscriptionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, FileText, Printer,
  User, Calendar, GraduationCap, School,
  Users, AlertCircle, CheckCircle, Loader2,
  Clock, Phone, Mail, MapPin, UserCheck,
  File, X, ChevronRight, BadgeCheck, CreditCard,
  BookOpen, Building2, UserRound, UserPlus
} from 'lucide-react';

const InscriptionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

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
  const fetchInscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      console.log(`🔍 Récupération de l'inscription ${id}...`);
      
      const response = await axiosInstance.get(`/inscriptions/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      console.log('📦 Données reçues:', response.data);
      
      // S'assurer que les données sont complètes
      const data = response.data;
      
      // Construire un objet avec des valeurs par défaut
      setInscription({
        id: data.id,
        eleve: data.eleve || null,
        eleve_nom: data.eleve_nom || data.eleve?.nom || 'Nom non renseigné',
        eleve_prenom: data.eleve_prenom || data.eleve?.prenom || 'Prénom non renseigné',
        eleve_matricule: data.eleve_matricule || data.eleve?.matricule || 'N/A',
        annee_scolaire: data.annee_scolaire || null,
        annee_libelle: data.annee_libelle || data.annee_scolaire?.libelle || 'Année non renseignée',
        niveau: data.niveau || null,
        niveau_nom: data.niveau_nom || data.niveau?.nom || 'Niveau non renseigné',
        classe: data.classe || null,
        classe_nom: data.classe_nom || data.classe?.nom || 'Classe non renseignée',
        date_inscription: data.date_inscription || null,
        date_reinscription: data.date_reinscription || null,
        statut: data.statut || 'inscrit',
        tarif_inscription: data.tarif_inscription || 0,
        tarif_mensuel: data.tarif_mensuel || 0,
        numero_acte: data.numero_acte || '',
        observations: data.observations || '',
        etablissement: data.etablissement || null,
        cree_par: data.cree_par || null,
        date_creation: data.date_creation || null,
        date_modification: data.date_modification || null,
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Inscription non trouvée');
      } else if (error.response?.status === 403) {
        setError('Vous n\'avez pas la permission de voir cette inscription');
      } else {
        setError('Erreur lors du chargement des détails');
        showNotification('Erreur lors du chargement des détails', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInscription();
    } else {
      setError('ID d\'inscription manquant');
      setLoading(false);
    }
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/inscriptions/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Inscription supprimée avec succès', 'success');
      setTimeout(() => navigate('/inscriptions'), 1500);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // NAVIGATION VERS L'ÉLÈVE
  // ============================================================
  const goToEleve = () => {
    if (inscription?.eleve) {
      navigate(`/eleves/${inscription.eleve}`);
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

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
  };

  const getStatutBadge = (statut) => {
    const map = {
      inscrit: 'badge-success',
      reinscrit: 'badge-info',
      transfert: 'badge-warning',
      abandon: 'badge-error'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      inscrit: 'Inscrit',
      reinscrit: 'Réinscrit',
      transfert: 'Transfert',
      abandon: 'Abandon'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutIcon = (statut) => {
    const map = {
      inscrit: CheckCircle,
      reinscrit: UserCheck,
      transfert: ArrowLeft,
      abandon: X
    };
    return map[statut] || CheckCircle;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-base-content/70 animate-pulse">
            Chargement des détails de l'inscription...
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
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error">{error}</h3>
          <p className="text-gray-500 text-sm">
            Vérifiez que l'ID de l'inscription est correct et que vous avez les permissions nécessaires.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/inscriptions')} 
              className="btn btn-primary gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>
            <button 
              onClick={fetchInscription} 
              className="btn btn-outline gap-2"
            >
              <Loader2 className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - Aucune donnée
  // ============================================================
  if (!inscription) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500">Aucune donnée disponible</h3>
          <p className="text-gray-400 text-sm">L'inscription demandée n'a pas pu être chargée.</p>
          <button onClick={() => navigate('/inscriptions')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  const StatutIcon = getStatutIcon(inscription.statut);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle flex-shrink-0" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette inscription ?</p>
              <p className="font-semibold text-error mt-2 text-lg">
                {inscription.eleve_prenom} {inscription.eleve_nom}
              </p>
              <p className="text-sm text-gray-500">{inscription.annee_libelle}</p>
              <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button 
                className="btn btn-ghost flex-1" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="btn btn-error flex-1 gap-2" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/inscriptions')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                  {inscription.eleve_prenom} {inscription.eleve_nom}
                  <span className={`badge ${getStatutBadge(inscription.statut)} gap-1 text-xs sm:text-sm`}>
                    <StatutIcon className="w-3 h-3" />
                    {getStatutLabel(inscription.statut)}
                  </span>
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {inscription.eleve_matricule}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                  <span className="text-primary font-medium">{inscription.annee_libelle}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                  <span className="text-gray-400 text-xs">
                    #{String(inscription.id).padStart(6, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-14 sm:ml-0">
            <button 
              onClick={goToEleve}
              className="btn btn-sm btn-outline gap-2 hover:bg-primary/10 transition-all"
              disabled={!inscription.eleve}
            >
              <User className="w-4 h-4" /> Voir l'élève
            </button>
            <button 
              onClick={() => navigate(`/inscriptions/${id}/pdf`)} 
              className="btn btn-sm btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={() => navigate(`/inscriptions/${id}/modifier`)} 
              className="btn btn-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="btn btn-sm btn-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Élève</p>
          <p className="text-sm font-semibold text-gray-700 truncate" title={`${inscription.eleve_prenom} ${inscription.eleve_nom}`}>
            {inscription.eleve_prenom} {inscription.eleve_nom}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Année scolaire</p>
          <p className="text-sm font-semibold text-primary truncate">{inscription.annee_libelle}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Niveau / Classe</p>
          <p className="text-sm font-semibold text-gray-700 truncate">
            {inscription.niveau_nom} {inscription.classe_nom ? `- ${inscription.classe_nom}` : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Date d'inscription</p>
          <p className="text-sm font-semibold text-gray-700">{formatDate(inscription.date_inscription)}</p>
        </div>
      </div>

      {/* ============================================================
          INFORMATIONS DÉTAILLÉES
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" /> Informations générales
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">ID Inscription</span>
              <span className="font-mono font-medium">#{String(inscription.id).padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Date d'inscription</span>
              <span className="font-medium">{formatDate(inscription.date_inscription)}</span>
            </div>
            {inscription.date_reinscription && (
              <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-500">Date de réinscription</span>
                <span className="font-medium">{formatDate(inscription.date_reinscription)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Numéro d'acte</span>
              <span className="font-medium">{inscription.numero_acte || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut</span>
              <span className={`badge ${getStatutBadge(inscription.statut)} gap-1`}>
                <StatutIcon className="w-3 h-3" />
                {getStatutLabel(inscription.statut)}
              </span>
            </div>
          </div>
        </div>

        {/* Informations scolaires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <School className="w-4 h-4 text-primary" /> Informations scolaires
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Année scolaire</span>
              <span className="font-medium text-primary">{inscription.annee_libelle}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Niveau</span>
              <span className="font-medium flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-gray-400" /> 
                {inscription.niveau_nom}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Classe</span>
              <span className="font-medium flex items-center gap-1">
                <School className="w-4 h-4 text-gray-400" /> 
                {inscription.classe_nom}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Établissement</span>
              <span className="font-medium flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-400" /> 
                {inscription.etablissement?.nom || 'Non défini'}
              </span>
            </div>
          </div>
        </div>

        {/* Informations financières */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" /> Informations financières
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Tarif d'inscription</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(inscription.tarif_inscription)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Tarif mensuel</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(inscription.tarif_mensuel)}</p>
            </div>
          </div>
        </div>

        {/* Informations sur l'élève */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" /> Informations sur l'élève
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Nom complet</span>
              <span className="font-medium">{inscription.eleve_prenom} {inscription.eleve_nom}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Matricule</span>
              <span className="font-mono font-medium">{inscription.eleve_matricule}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ID Élève</span>
              <span className="font-mono font-medium">#{inscription.eleve ? String(inscription.eleve).padStart(6, '0') : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Observations */}
        {inscription.observations && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" /> Observations
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{inscription.observations}</p>
            </div>
          </div>
        )}

        {/* Audit */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" /> Audit
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Créé le</span>
                <span className="font-medium">{formatDateTime(inscription.date_creation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifié le</span>
                <span className="font-medium">{formatDateTime(inscription.date_modification)}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Créé par</span>
                <span className="font-medium">
                  {inscription.cree_par?.username || inscription.cree_par || 'Système'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionDetail;