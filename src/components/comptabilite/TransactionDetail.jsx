// src/components/comptabilite/TransactionDetail.jsx
// Détails d'une transaction - Pleine largeur

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, User, CreditCard, Wallet,
  AlertCircle, CheckCircle, Loader2, X,
  Wifi, WifiOff, Calendar, Clock, FileText,
  Hash, Building2, Users, DollarSign,
  TrendingUp, TrendingDown, Check, Ban,
  Printer, Download, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, Info,
  RefreshCw, Briefcase, Activity, BookOpen,
  Truck, Coffee, Library, Home, Shield,
  Banknote, Award, UserCheck, UserCog
} from 'lucide-react';

const TransactionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMotif, setCancelMotif] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

      const res = await axiosInstance.get(`/transactions/${id}/`, headers);
      setTransaction(res.data);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Transaction non trouvée');
      } else if (error.response?.status === 403) {
        setError('Vous n\'avez pas la permission de voir cette transaction');
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
      setError('ID de transaction manquant');
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
      await axiosInstance.delete(`/transactions/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction supprimée avec succès', 'success');
      setTimeout(() => navigate('/transactions'), 1500);
    } catch (error) {
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
  // VALIDATION
  // ============================================================
  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/transactions/${id}/valider/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction validée avec succès', 'success');
      fetchData();
      setShowValidateModal(false);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de valider', 'error');
      } else {
        showNotification('Erreur lors de la validation', 'error');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // ============================================================
  // ANNULATION
  // ============================================================
  const handleCancel = async () => {
    if (!cancelMotif.trim()) {
      showNotification('Veuillez fournir un motif d\'annulation', 'error');
      return;
    }
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/transactions/${id}/annuler/`, {
        motif: cancelMotif
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction annulée avec succès', 'success');
      fetchData();
      setShowCancelModal(false);
      setCancelMotif('');
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission d\'annuler', 'error');
      } else {
        showNotification('Erreur lors de l\'annulation', 'error');
      }
    } finally {
      setIsCancelling(false);
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

  const getTypeLabel = (type) => {
    const map = {
      credit: 'Crédit (Payé)',
      debit: 'Débit (Dû)'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeColor = (type) => {
    return type === 'credit' ? 'text-success' : 'text-error';
  };

  const getTypeBg = (type) => {
    return type === 'credit' ? 'bg-success/10' : 'bg-error/10';
  };

  const getCategorieLabel = (categorie) => {
    const map = {
      inscription: 'Frais d\'inscription',
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
      inscription: BookOpen,
      mensualite: Calendar,
      scolarite: BookOpen,
      transport: Truck,
      cantine: Coffee,
      bibliotheque: Library,
      activite: Activity,
      salaire: Briefcase,
      fourniture: Home,
      entretien: Home,
      equipement: Building2,
      taxe: Banknote,
      assurance: Shield,
      remise: Award,
      annulation: X,
      autre: FileText
    };
    return map[categorie] || FileText;
  };

  const getStatutLabel = (statut) => {
    const map = {
      attente: 'En attente',
      valide: 'Validée',
      annule: 'Annulée',
      rembourse: 'Remboursée'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutColor = (statut) => {
    const map = {
      attente: 'badge-warning',
      valide: 'badge-success',
      annule: 'badge-error',
      rembourse: 'badge-info'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutIcon = (statut) => {
    const map = {
      attente: Clock,
      valide: CheckCircle,
      annule: Ban,
      rembourse: RefreshCw
    };
    return map[statut] || AlertCircle;
  };

  const getModePaiementLabel = (mode) => {
    const map = {
      especes: 'Espèces',
      cheque: 'Chèque',
      virement: 'Virement',
      carte: 'Carte bancaire',
      mobile: 'Mobile Money',
      transfert: 'Transfert',
      autre: 'Autre'
    };
    return map[mode] || mode || '-';
  };

  const getClientName = () => {
    if (!transaction) return '-';
    if (transaction.client_nom) return transaction.client_nom;
    if (transaction.compte_client) {
      if (typeof transaction.compte_client === 'object') {
        return `${transaction.compte_client.prenom || ''} ${transaction.compte_client.nom || ''}`;
      }
    }
    return '-';
  };

  const getClientMatricule = () => {
    if (!transaction) return '-';
    if (transaction.client_matricule) return transaction.client_matricule;
    if (transaction.compte_client && typeof transaction.compte_client === 'object') {
      return transaction.compte_client.matricule || '-';
    }
    return '-';
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
            Chargement de la transaction...
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
            <button onClick={() => navigate('/transactions')} className="btn btn-primary gap-2">
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

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/transactions')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  const isCredit = transaction.type_transaction === 'credit';
  const isValide = transaction.statut === 'valide';
  const isAttente = transaction.statut === 'attente';
  const isAnnule = transaction.statut === 'annule';
  const CategorieIcon = getCategorieIcon(transaction.categorie);
  const StatutIcon = getStatutIcon(transaction.statut);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette transaction ?</p>
              <p className="font-semibold text-error mt-2 text-lg">
                {formatCurrency(transaction.montant)}
              </p>
              <p className="text-sm text-gray-500">{transaction.description}</p>
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

      {/* ============================================================
          MODAL VALIDATION
          ============================================================ */}
      {showValidateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-success/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-success">Valider la transaction</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous valider cette transaction ?</p>
              <p className="font-semibold text-success mt-2 text-lg">
                {formatCurrency(transaction.montant)}
              </p>
              <p className="text-sm text-gray-500">{transaction.description}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowValidateModal(false)} disabled={isValidating}>
                Annuler
              </button>
              <button className="btn btn-success flex-1 gap-2" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isValidating ? 'Validation...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL ANNULATION
          ============================================================ */}
      {showCancelModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-warning/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
                <Ban className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold text-warning">Annuler la transaction</h3>
            </div>
            <div className="p-6">
              <p className="text-base-content/70 text-center">Voulez-vous annuler cette transaction ?</p>
              <p className="font-semibold text-warning mt-2 text-lg text-center">
                {formatCurrency(transaction.montant)}
              </p>
              <p className="text-sm text-gray-500 text-center mb-4">{transaction.description}</p>
              <div className="form-control">
                <label className="label text-sm font-medium">Motif d'annulation</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Expliquez le motif de l'annulation..."
                  value={cancelMotif}
                  onChange={(e) => setCancelMotif(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => {
                setShowCancelModal(false);
                setCancelMotif('');
              }} disabled={isCancelling}>
                Annuler
              </button>
              <button className="btn btn-warning flex-1 gap-2" onClick={handleCancel} disabled={isCancelling || !cancelMotif.trim()}>
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                {isCancelling ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/transactions')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className={`flex items-center gap-3 p-3 rounded-xl ${getTypeBg(transaction.type_transaction)}`}>
              {isCredit ? (
                <TrendingUp className="w-7 h-7 text-success" />
              ) : (
                <TrendingDown className="w-7 h-7 text-error" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {isCredit ? 'Crédit' : 'Débit'}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <CategorieIcon className="w-3 h-3" />
                  {getCategorieLabel(transaction.categorie)}
                </p>
              </div>
            </div>
            <span className={`badge ${getStatutColor(transaction.statut)} gap-1 px-3 py-2 text-sm hidden sm:flex`}>
              <StatutIcon className="w-3 h-3" />
              {getStatutLabel(transaction.statut)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            
            <button 
              onClick={() => navigate(`/transactions/${id}/modifier`)} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            
            {isAttente && (
              <>
                <button 
                  onClick={() => setShowValidateModal(true)} 
                  className="btn btn-sm btn-success gap-2"
                >
                  <Check className="w-4 h-4" /> Valider
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="btn btn-sm btn-error gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </>
            )}
            
            {!isAnnule && !isValide && (
              <button 
                onClick={() => setShowCancelModal(true)} 
                className="btn btn-sm btn-warning gap-2"
              >
                <Ban className="w-4 h-4" /> Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          CONTENU PRINCIPAL - PLEINE LARGEUR
          ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* ============================================================
            CARTE MONTANT PRINCIPAL
            ============================================================ */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8 text-center mb-6">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Montant de la transaction</p>
          <p className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isCredit ? 'text-success' : 'text-error'} mt-2`}>
            {isCredit ? '+' : '-'} {formatCurrency(transaction.montant)}
          </p>
          <p className="text-sm text-gray-400 mt-3 max-w-2xl mx-auto">{transaction.description}</p>
          {transaction.numero_facture && (
            <p className="text-xs text-gray-400 mt-2">Facture N° {transaction.numero_facture}</p>
          )}
        </div>

        {/* ============================================================
            GRILLE 2 COLONNES - GAUCHE / DROITE
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* ============================================================
              COLONNE GAUCHE
              ============================================================ */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" /> Client
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{getClientName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Matricule</span>
                  <span className="font-mono font-medium">{getClientMatricule()}</span>
                </div>
              </div>
            </div>

            {/* Professeur */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-primary" /> Professeur
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">
                    {transaction.professeur_nom || 
                     (transaction.compte_professeur && typeof transaction.compte_professeur === 'object' 
                       ? `${transaction.compte_professeur.prenom || ''} ${transaction.compte_professeur.nom || ''}` 
                       : '-')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Matricule</span>
                  <span className="font-mono font-medium">
                    {transaction.compte_professeur && typeof transaction.compte_professeur === 'object'
                      ? transaction.compte_professeur.matricule || '-'
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Surveillant */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" /> Surveillant
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">
                    {transaction.surveillant_nom ||
                     (transaction.compte_surveillant && typeof transaction.compte_surveillant === 'object'
                       ? `${transaction.compte_surveillant.prenom || ''} ${transaction.compte_surveillant.nom || ''}`
                       : '-')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Matricule</span>
                  <span className="font-mono font-medium">
                    {transaction.compte_surveillant && typeof transaction.compte_surveillant === 'object'
                      ? transaction.compte_surveillant.matricule || '-'
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              COLONNE DROITE
              ============================================================ */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Détails de la transaction */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" /> Détails
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-medium flex items-center gap-1">
                    <CategorieIcon className="w-3 h-3 text-gray-400" />
                    {getCategorieLabel(transaction.categorie)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Type</span>
                  <span className={`font-medium ${getTypeColor(transaction.type_transaction)}`}>
                    {getTypeLabel(transaction.type_transaction)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Mode de paiement</span>
                  <span className="font-medium">{getModePaiementLabel(transaction.mode_paiement)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Référence</span>
                  <span className="font-mono font-medium">{transaction.reference_paiement || '-'}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" /> Dates
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Date de transaction</span>
                  <span className="font-medium">{formatDate(transaction.date_transaction)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Date d'échéance</span>
                  <span className="font-medium">{formatDate(transaction.date_echeance) || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Date de paiement</span>
                  <span className="font-medium">{formatDate(transaction.date_paiement) || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de validation</span>
                  <span className="font-medium">{formatDate(transaction.date_validation) || '-'}</span>
                </div>
              </div>
            </div>

            {/* Statut et validation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-primary" /> Statut et validation
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Statut</span>
                  <span className={`badge ${getStatutColor(transaction.statut)} gap-1`}>
                    <StatutIcon className="w-3 h-3" />
                    {getStatutLabel(transaction.statut)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Validée</span>
                  <span className="font-medium">{transaction.est_valide ? '✅ Oui' : '❌ Non'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Facture générée</span>
                  <span className="font-medium">{transaction.facture_generee ? '✅ Oui' : '❌ Non'}</span>
                </div>
                {transaction.numero_facture && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">N° Facture</span>
                    <span className="font-mono font-medium">{transaction.numero_facture}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            AUDIT - PLEINE LARGEUR
            ============================================================ */}
        <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" /> Audit
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Créé par</span>
                <span className="font-medium">
                  {transaction.cree_par?.email || transaction.cree_par?.username || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Créé le</span>
                <span className="font-medium">{formatDateTime(transaction.date_creation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifié le</span>
                <span className="font-medium">{formatDateTime(transaction.date_modification)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Validé par</span>
                <span className="font-medium">
                  {transaction.valide_par?.email || transaction.valide_par?.username || '-'}
                </span>
              </div>
              {transaction.annule_par && (
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Annulé par</span>
                  <span className="font-medium">
                    {transaction.annule_par?.email || transaction.annule_par?.username || '-'}
                  </span>
                </div>
              )}
              {transaction.motif_annulation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Motif annulation</span>
                  <span className="font-medium text-right max-w-[200px]">{transaction.motif_annulation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;