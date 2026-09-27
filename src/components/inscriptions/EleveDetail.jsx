// src/components/inscriptions/EleveDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, FileText, Printer,
  User, Mail, Phone, Home, Calendar, Clock,
  UserCheck, UserX, AlertCircle, CheckCircle,
  GraduationCap, School, Users, Briefcase,
  PhoneCall, UserRound, Heart, Stethoscope,
  Droplet, AlertTriangle, FileText as FileIcon,
  Loader2, CreditCard, DollarSign, TrendingUp,
  Eye, Download, RefreshCw, Building2,
  X, ChevronRight, Award, BadgeCheck,
  BookOpen, MapPin, MoreVertical, Copy,
  ExternalLink, Shield, Wifi, WifiOff
} from 'lucide-react';

const EleveDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [transactions, setTransactions] = useState([]);
  const [echeances, setEcheances] = useState([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  // ============================================================
  // SURVEILLER LA CONNEXION
  // ============================================================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchEleve = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get(`/eleves/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setEleve(response.data);
      
      // Charger les données financières si disponible
      if (response.data.compte_client) {
        await fetchFinancialData(response.data.compte_client);
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Élève non trouvé');
      } else {
        setError('Erreur lors du chargement des détails');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async (compteId) => {
    setLoadingFinancial(true);
    try {
      const token = localStorage.getItem('Token');
      
      // Charger les transactions
      const transactionsRes = await axiosInstance.get(`/comptes/${compteId}/transactions/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setTransactions(transactionsRes.data || []);
      
      // Charger les échéances
      const echeancesRes = await axiosInstance.get(`/comptes/${compteId}/echeances/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setEcheances(echeancesRes.data || []);
    } catch (error) {
      console.warn('⚠️ Erreur chargement données financières:', error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEleve();
    }
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/eleves/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Élève supprimé avec succès', 'success');
      setTimeout(() => navigate('/eleves'), 1500);
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
  // PDF
  // ============================================================
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/eleves/${id}/pdf/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Eleve_${eleve?.matricule || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============================================================
  // NAVIGATION VERS LA VUE PDF
  // ============================================================
  const goToPdfView = () => {
    navigate(`/eleves/${id}/pdf`);
  };

  // ============================================================
  // CHANGER LE STATUT
  // ============================================================
  const handleChangeStatut = async (newStatut) => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/eleves/${id}/changer_statut/`, 
        { statut: newStatut },
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification(`Statut changé avec succès`, 'success');
      fetchEleve();
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      showNotification('Erreur lors du changement de statut', 'error');
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadge = (statut) => {
    const map = {
      actif: 'badge-success',
      suspendu: 'badge-warning',
      exclu: 'badge-error',
      transfere: 'badge-info',
      diplome: 'badge-primary',
      abandon: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      actif: 'Actif',
      suspendu: 'Suspendu',
      exclu: 'Exclu',
      transfere: 'Transféré',
      diplome: 'Diplômé',
      abandon: 'Abandon'
    };
    return map[statut] || statut;
  };

  const getStatutColor = (statut) => {
    const map = {
      actif: 'text-success',
      suspendu: 'text-warning',
      exclu: 'text-error',
      transfere: 'text-info',
      diplome: 'text-primary',
      abandon: 'text-gray-500'
    };
    return map[statut] || 'text-gray-500';
  };

  const getSexeLabel = (sexe) => {
    return sexe === 'M' ? 'Masculin' : 'Féminin';
  };

  const getSexeIcon = (sexe) => {
    return sexe === 'M' ? 
      <User className="w-5 h-5 text-blue-500" /> : 
      <UserRound className="w-5 h-5 text-pink-500" />;
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-base-content/70 animate-pulse">
            Chargement des détails...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error mx-auto" />
          <p className="text-xl font-semibold text-error">{error}</p>
          <button onClick={() => navigate('/eleves')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!eleve) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-xl font-semibold text-gray-500">Élève non trouvé</p>
          <button onClick={() => navigate('/eleves')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cet élève ?</p>
              <p className="font-semibold text-error mt-2">{eleve.prenom} {eleve.nom}</p>
              <p className="text-sm text-gray-500">{eleve.matricule}</p>
              <p className="text-sm text-warning mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Cette action est irréversible.
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/eleves')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                {getSexeIcon(eleve.sexe)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {eleve.prenom} {eleve.nom}
                  {eleve.inscription_complete ? (
                    <BadgeCheck className="w-5 h-5 text-success" />
                  ) : (
                    <Clock className="w-5 h-5 text-warning" />
                  )}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">{eleve.matricule}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{getSexeLabel(eleve.sexe)}</span>
                  {eleve.age && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{eleve.age} ans</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={goToPdfView}
              className="btn btn-sm btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <Eye className="w-4 h-4" /> Aperçu PDF
            </button>
            <button 
              onClick={handleGeneratePDF}
              className="btn btn-sm btn-outline gap-2 hover:bg-primary/10 transition-all"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isGeneratingPDF ? 'Génération...' : 'PDF'}
            </button>
            <button 
              onClick={() => navigate(`/eleves/${id}/modifier`)} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
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
          BADGES STATUT
          ============================================================ */}
      <div className="flex flex-wrap gap-3">
        <div className={`badge ${getStatutBadge(eleve.statut)} p-3 text-sm gap-1`}>
          <UserCheck className="w-4 h-4" /> {getStatutLabel(eleve.statut)}
        </div>
        <div className={`badge ${eleve.inscription_complete ? 'badge-success' : 'badge-warning'} p-3 text-sm gap-1`}>
          {eleve.inscription_complete ? (
            <><CheckCircle className="w-4 h-4" /> Inscription complète</>
          ) : (
            <><Clock className="w-4 h-4" /> Inscription à compléter</>
          )}
        </div>
        <div className="badge badge-ghost p-3 text-sm gap-1">
          <Calendar className="w-4 h-4" /> Inscrit le {formatDate(eleve.date_inscription)}
        </div>
        {eleve.date_sortie && (
          <div className="badge badge-ghost p-3 text-sm gap-1">
            <Clock className="w-4 h-4" /> Sortie le {formatDate(eleve.date_sortie)}
          </div>
        )}
      </div>

      {/* ============================================================
          ONGLETS
          ============================================================ */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-4">
        <div className="flex overflow-x-auto gap-1">
          {[
            { id: 'info', label: 'Informations', icon: User },
            { id: 'parents', label: 'Parents', icon: Users },
            { id: 'medical', label: 'Médical', icon: Heart },
            { id: 'finance', label: 'Finances', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          CONTENU DES ONGLETS
          ============================================================ */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-4 sm:p-6">
        
        {/* ============================================================
            ONGLET INFORMATIONS
            ============================================================ */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" /> Informations personnelles
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{eleve.nom}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Prénom</span>
                  <span className="font-medium">{eleve.prenom}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Date de naissance</span>
                  <span className="font-medium">{formatDate(eleve.date_naissance)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Lieu de naissance</span>
                  <span className="font-medium">{eleve.lieu_naissance || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Sexe</span>
                  <span className="font-medium flex items-center gap-1">
                    {getSexeIcon(eleve.sexe)} {getSexeLabel(eleve.sexe)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nationalité</span>
                  <span className="font-medium">{eleve.nationalite || 'Sénégalaise'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Âge</span>
                  <span className="font-medium">{eleve.age || '-'} ans</span>
                </div>
              </div>
            </div>

            {/* Contact et scolarité */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4 text-primary" /> Contact & Scolarité
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{eleve.telephone || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium truncate max-w-[150px]">{eleve.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Adresse</span>
                  <span className="font-medium text-right max-w-[150px]">{eleve.adresse || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-medium flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-gray-400" /> {eleve.niveau_nom || '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Classe</span>
                  <span className="font-medium flex items-center gap-1">
                    <School className="w-4 h-4 text-gray-400" /> {eleve.classe_nom || '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Année scolaire</span>
                  <span className="font-medium">{eleve.annee_scolaire_libelle || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date d'inscription</span>
                  <span className="font-medium">{formatDate(eleve.date_inscription)}</span>
                </div>
              </div>
            </div>

            {/* Changer le statut */}
            <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4 text-primary" /> Changer le statut
              </h3>
              <div className="flex flex-wrap gap-2">
                {['actif', 'suspendu', 'exclu', 'transfere', 'diplome', 'abandon'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChangeStatut(s)}
                    className={`btn btn-sm ${eleve.statut === s ? 'btn-primary' : 'btn-outline'} gap-1`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s === 'actif' ? 'bg-success' : 
                      s === 'suspendu' ? 'bg-warning' : 
                      s === 'exclu' ? 'bg-error' : 
                      s === 'transfere' ? 'bg-info' : 
                      s === 'diplome' ? 'bg-primary' : 'bg-gray-400'}`} />
                    {getStatutLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ONGLET PARENTS
            ============================================================ */}
        {activeTab === 'parents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Père */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-blue-500" /> Père
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{eleve.nom_pere || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium">{eleve.profession_pere || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{eleve.telephone_pere || '-'}</span>
                </div>
              </div>
            </div>

            {/* Mère */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-pink-500" /> Mère
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{eleve.nom_mere || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium">{eleve.profession_mere || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{eleve.telephone_mere || '-'}</span>
                </div>
              </div>
            </div>

            {/* Tuteur */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-accent" /> Tuteur
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{eleve.nom_tuteur || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium">{eleve.profession_tuteur || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{eleve.telephone_tuteur || '-'}</span>
                </div>
              </div>
            </div>

            {/* Situation familiale */}
            <div className="bg-gray-50 rounded-xl p-4 md:col-span-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" /> Situation familiale
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Responsable principal :</span>
                <span className="badge badge-primary">
                  {eleve.situation_familiale === 'pere' ? 'Père' :
                   eleve.situation_familiale === 'mere' ? 'Mère' :
                   eleve.situation_familiale === 'tuteur' ? 'Tuteur' : 'Autre'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ONGLET MÉDICAL
            ============================================================ */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Droplet className="w-4 h-4 text-red-500" /> Groupe sanguin
                </h3>
                <p className="text-lg font-bold text-center">
                  {eleve.groupe_sanguin || 'Non spécifié'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <PhoneForwarded className="w-4 h-4 text-info" /> Contact d'urgence
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Personne</span>
                    <span className="font-medium">{eleve.personne_a_contacter || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-medium">{eleve.telephone_urgence || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Allergies
                </h3>
                <p className="text-sm">{eleve.allergie || 'Aucune allergie connue'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Stethoscope className="w-4 h-4 text-info" /> Maladies chroniques
                </h3>
                <p className="text-sm">{eleve.maladie || 'Aucune maladie chronique'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ONGLET FINANCES
            ============================================================ */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Situation financière */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Total dû</p>
                <p className="text-xl font-bold text-gray-700">
                  {formatCurrency(eleve.situation_financiere_simple?.total_du || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Total payé</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(eleve.situation_financiere_simple?.total_paye || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Solde</p>
                <p className={`text-xl font-bold ${(eleve.situation_financiere_simple?.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
                  {formatCurrency(eleve.situation_financiere_simple?.solde || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Situation</p>
                <span className={`badge ${eleve.situation_financiere_simple?.situation === 'Normal' ? 'badge-success' : 'badge-error'} text-sm`}>
                  {eleve.situation_financiere_simple?.situation || 'Normal'}
                </span>
              </div>
            </div>

            {loadingFinancial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Chargement des données financières...</span>
              </div>
            ) : (
              <>
                {/* Échéances */}
                {echeances.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-primary" /> Échéances
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th>Libellé</th>
                            <th>Montant</th>
                            <th>Date échéance</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {echeances.slice(0, 5).map((e, idx) => (
                            <tr key={idx}>
                              <td>{e.libelle}</td>
                              <td>{formatCurrency(e.montant)}</td>
                              <td>{formatDate(e.date_echeance)}</td>
                              <td>
                                <span className={`badge ${
                                  e.statut === 'paye' ? 'badge-success' :
                                  e.statut === 'en_retard' ? 'badge-error' :
                                  'badge-warning'
                                }`}>
                                  {e.statut === 'paye' ? 'Payé' :
                                   e.statut === 'en_retard' ? 'En retard' : 'À payer'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {echeances.length > 5 && (
                        <p className="text-xs text-gray-400 mt-2">+ {echeances.length - 5} autres échéances</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" /> Dernières transactions
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th>Date</th>
                            <th>Libellé</th>
                            <th>Montant</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice(0, 5).map((t, idx) => (
                            <tr key={idx}>
                              <td>{formatDateTime(t.date_transaction)}</td>
                              <td>{t.libelle}</td>
                              <td className={t.type === 'credit' ? 'text-success' : 'text-error'}>
                                {t.type === 'credit' ? '+' : '-'} {formatCurrency(t.montant)}
                              </td>
                              <td>
                                <span className={`badge ${t.type === 'credit' ? 'badge-success' : 'badge-error'}`}>
                                  {t.type === 'credit' ? 'Crédit' : 'Débit'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {echeances.length === 0 && transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Aucune donnée financière disponible</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          OBSERVATIONS
          ============================================================ */}
      {eleve.observations && (
        <div className="card bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="card-body p-4 sm:p-6">
            <h3 className="card-title text-sm font-semibold flex items-center gap-2">
              <FileIcon className="w-4 h-4 text-primary" /> Observations
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{eleve.observations}</p>
          </div>
        </div>
      )}

      {/* ============================================================
          AUDIT
          ============================================================ */}
      <div className="text-xs text-gray-400 text-center py-2">
        Créé le {formatDateTime(eleve.date_creation)} • 
        Modifié le {formatDateTime(eleve.date_modification)}
        {eleve.cree_par && ` • Par ${eleve.cree_par}`}
      </div>
    </div>
  );
};

export default EleveDetail;