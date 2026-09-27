// src/components/comptabilite/EcheanceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, Calendar, RefreshCw,
  X, CheckCircle, AlertCircle, Loader2,
  User, DollarSign, Tag, FileText, Clock, Info,
  CreditCard, Wallet, Wifi, WifiOff,
  AlertTriangle, Eye, Printer, Download,
  Building2, Phone, Mail, MapPin,
  BookOpen, Home, Briefcase, GraduationCap,
  Bus, Utensils, Library, Activity,
  DollarSign as Money, Shield, Gift, Ban,
  MoreVertical
} from 'lucide-react';

const EcheanceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [echeance, setEcheance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [clientDetails, setClientDetails] = useState(null);

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
      
      const echeanceRes = await axiosInstance.get(`/echeances/${id}/`, headers);
      setEcheance(echeanceRes.data);

      if (echeanceRes.data.compte_client) {
        try {
          const clientRes = await axiosInstance.get(`/comptes-clients/${echeanceRes.data.compte_client}/`, headers);
          setClientDetails(clientRes.data);
        } catch (clientError) {
          console.warn('⚠️ Erreur chargement client:', clientError);
        }
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Échéance non trouvée');
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
      setError('ID d\'échéance manquant');
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
      await axiosInstance.delete(`/echeances/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Échéance supprimée avec succès', 'success');
      setTimeout(() => navigate('/echeances'), 1500);
    } catch (error) {
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
  // MARQUER COMME PAYÉ
  // ============================================================
  const handleMarquerPaye = async () => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/echeances/${id}/marquer_paye/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Échéance marquée comme payée', 'success');
      fetchData();
    } catch (error) {
      console.error('❌ Erreur:', error);
      showNotification('Erreur lors du marquage', 'error');
    }
  };

  // ============================================================
  // GÉNÉRER PDF
  // ============================================================
  const handleGeneratePDF = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/echeances/${id}/pdf/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `echeance_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
  };

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

  const getStatutLabel = (statut) => {
    const map = {
      a_payer: 'À payer',
      paye: 'Payé',
      en_retard: 'En retard',
      annule: 'Annulé'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutBadge = (statut) => {
    const map = {
      a_payer: 'badge-warning',
      paye: 'badge-success',
      en_retard: 'badge-error',
      annule: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutColor = (statut) => {
    const map = {
      a_payer: 'text-warning',
      paye: 'text-success',
      en_retard: 'text-error',
      annule: 'text-gray-400'
    };
    return map[statut] || 'text-gray-500';
  };

  const getCategorieLabel = (categorie) => {
    const map = {
      inscription: "Frais d'inscription",
      mensualite: 'Mensualité',
      scolarite: 'Scolarité',
      transport: 'Transport',
      cantine: 'Cantine',
      bibliotheque: 'Bibliothèque',
      activite: 'Activité parascolaire',
      salaire: 'Salaire',
      fourniture: 'Fourniture',
      entretien: 'Entretien',
      equipement: 'Équipement',
      taxe: 'Taxe',
      assurance: 'Assurance',
      remise: 'Remise',
      annulation: 'Annulation',
      autre: 'Autre'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  const getCategorieIcon = (categorie) => {
    const map = {
      inscription: <BookOpen className="w-4 h-4" />,
      mensualite: <Calendar className="w-4 h-4" />,
      scolarite: <GraduationCap className="w-4 h-4" />,
      transport: <Bus className="w-4 h-4" />,
      cantine: <Utensils className="w-4 h-4" />,
      bibliotheque: <Library className="w-4 h-4" />,
      activite: <Activity className="w-4 h-4" />,
      salaire: <Money className="w-4 h-4" />,
      fourniture: <Briefcase className="w-4 h-4" />,
      entretien: <Home className="w-4 h-4" />,
      equipement: <Building2 className="w-4 h-4" />,
      taxe: <FileText className="w-4 h-4" />,
      assurance: <Shield className="w-4 h-4" />,
      remise: <Gift className="w-4 h-4" />,
      annulation: <Ban className="w-4 h-4" />,
      autre: <MoreVertical className="w-4 h-4" />
    };
    return map[categorie] || <FileText className="w-4 h-4" />;
  };

  const getCategorieColor = (categorie) => {
    const map = {
      inscription: 'badge-primary',
      mensualite: 'badge-secondary',
      scolarite: 'badge-info',
      transport: 'badge-warning',
      cantine: 'badge-success',
      bibliotheque: 'badge-ghost',
      activite: 'badge-accent',
      salaire: 'badge-error',
      fourniture: 'badge-ghost',
      entretien: 'badge-ghost',
      equipement: 'badge-ghost',
      taxe: 'badge-ghost',
      assurance: 'badge-ghost',
      remise: 'badge-info',
      annulation: 'badge-error',
      autre: 'badge-ghost'
    };
    return map[categorie] || 'badge-ghost';
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4 animate-pulse">
            Chargement de l'échéance...
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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">{error}</h3>
          <p className="text-gray-500 text-sm mt-2">Veuillez réessayer.</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/echeances')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={fetchData} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!echeance) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/echeances')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      
      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette échéance ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{echeance.libelle}</p>
              <p className="text-sm text-gray-500">{formatCurrency(echeance.montant)}</p>
              {echeance.statut === 'paye' && (
                <p className="text-sm text-success mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Cette échéance est déjà payée
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/echeances')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {echeance.libelle}
                  {echeance.statut === 'paye' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {echeance.statut === 'en_retard' && (
                    <AlertTriangle className="w-5 h-5 text-error" />
                  )}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">#{echeance.id}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{formatCurrency(echeance.montant)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1">
                    {getCategorieIcon(echeance.categorie)}
                    {getCategorieLabel(echeance.categorie)}
                  </span>
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
              onClick={handleGeneratePDF} 
              className="btn btn-sm btn-outline gap-2"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>
            {echeance.statut !== 'paye' && echeance.statut !== 'annule' && (
              <button 
                onClick={handleMarquerPaye} 
                className="btn btn-sm btn-success gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Marquer payé
              </button>
            )}
            <button 
              onClick={() => navigate(`/echeances/${id}/modifier`)} 
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

      {/* BADGES STATUT */}
      <div className="flex flex-wrap gap-3">
        <div className={`badge ${getStatutBadge(echeance.statut)} p-3 text-sm gap-1`}>
          {echeance.statut === 'a_payer' && <Clock className="w-4 h-4" />}
          {echeance.statut === 'paye' && <CheckCircle className="w-4 h-4" />}
          {echeance.statut === 'en_retard' && <AlertTriangle className="w-4 h-4" />}
          {echeance.statut === 'annule' && <X className="w-4 h-4" />}
          {getStatutLabel(echeance.statut)}
        </div>
        <div className={`badge ${getCategorieColor(echeance.categorie)} p-3 text-sm gap-1`}>
          <Tag className="w-4 h-4" /> {getCategorieLabel(echeance.categorie)}
        </div>
        <div className="badge badge-ghost p-3 text-sm gap-1">
          <Calendar className="w-4 h-4" /> Échéance: {formatDate(echeance.date_echeance)}
        </div>
        {echeance.numero_mensualite && (
          <div className="badge badge-ghost p-3 text-sm gap-1">
            <Clock className="w-4 h-4" /> Mensualité #{echeance.numero_mensualite}
          </div>
        )}
        {echeance.est_en_retard && (
          <div className="badge badge-error p-3 text-sm gap-1 animate-pulse">
            <AlertTriangle className="w-4 h-4" /> En retard
          </div>
        )}
      </div>

      {/* CARTE RÉSUMÉ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Montant</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(echeance.montant)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Statut</p>
            <p className={`text-lg font-bold ${getStatutColor(echeance.statut)}`}>
              {getStatutLabel(echeance.statut)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Date d'échéance</p>
            <p className="text-lg font-bold text-gray-700">{formatDate(echeance.date_echeance)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Catégorie</p>
            <p className="text-lg font-bold text-gray-700">{getCategorieLabel(echeance.categorie)}</p>
          </div>
        </div>
      </div>

      {/* INFORMATIONS DÉTAILLÉES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-primary" /> Informations générales
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">ID</span>
              <span className="font-mono">#{echeance.id}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Libellé</span>
              <span className="font-medium">{echeance.libelle}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Montant</span>
              <span className="font-bold text-primary">{formatCurrency(echeance.montant)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Catégorie</span>
              <span className={`badge ${getCategorieColor(echeance.categorie)} gap-1`}>
                {getCategorieIcon(echeance.categorie)}
                {getCategorieLabel(echeance.categorie)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Date d'échéance</span>
              <span className="font-medium">{formatDate(echeance.date_echeance)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Statut</span>
              <span className={`badge ${getStatutBadge(echeance.statut)} gap-1`}>
                {echeance.statut === 'a_payer' && <Clock className="w-3 h-3" />}
                {echeance.statut === 'paye' && <CheckCircle className="w-3 h-3" />}
                {echeance.statut === 'en_retard' && <AlertTriangle className="w-3 h-3" />}
                {echeance.statut === 'annule' && <X className="w-3 h-3" />}
                {getStatutLabel(echeance.statut)}
              </span>
            </div>
            {echeance.numero_mensualite && (
              <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-500">N° Mensualité</span>
                <span className="font-medium">#{echeance.numero_mensualite}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">En retard</span>
              <span className={`badge ${echeance.est_en_retard ? 'badge-error' : 'badge-success'}`}>
                {echeance.est_en_retard ? 'Oui' : 'Non'}
              </span>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" /> Client associé
          </h3>
          {clientDetails ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{clientDetails.prenom} {clientDetails.nom}</p>
                  <p className="text-sm text-gray-500 font-mono">{clientDetails.matricule}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{clientDetails.type_client || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{clientDetails.telephone || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium truncate max-w-[150px]">{clientDetails.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Solde</span>
                  <span className={`font-bold ${parseFloat(clientDetails.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
                    {formatCurrency(clientDetails.solde)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/comptes-clients/${clientDetails.id}`)}
                className="btn btn-sm btn-outline w-full mt-2 gap-2"
              >
                <Eye className="w-4 h-4" /> Voir le client
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun client associé</p>
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTION LIÉE */}
      {echeance.transaction && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" /> Transaction liée
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">ID Transaction</span>
              <span className="font-mono">#{echeance.transaction}</span>
            </div>
            <button 
              onClick={() => navigate(`/transactions/${echeance.transaction}`)}
              className="btn btn-sm btn-outline w-full mt-2 gap-2"
            >
              <Eye className="w-4 h-4" /> Voir la transaction
            </button>
          </div>
        </div>
      )}

      {/* AUDIT */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" /> Audit
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Créé le</span>
              <span className="font-medium">{formatDateTime(echeance.date_creation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Modifié le</span>
              <span className="font-medium">{formatDateTime(echeance.date_modification)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIED DE PAGE */}
      <div className="text-xs text-gray-400 text-center py-2">
        Créé le {formatDateTime(echeance.date_creation)} • 
        Modifié le {formatDateTime(echeance.date_modification)}
      </div>
    </div>
  );
};

export default EcheanceDetail;