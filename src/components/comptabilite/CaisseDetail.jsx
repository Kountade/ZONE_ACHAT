// src/components/comptabilite/CaisseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, Wallet, RefreshCw,
  X, CheckCircle, AlertCircle, Loader2,
  User, DollarSign, Calendar, Clock, Info,
  TrendingUp, TrendingDown, Wifi, WifiOff,
  Plus, Eye, Printer, Download,
  Building2, Phone, Mail, MapPin,
  MoreVertical, Ban, Check, ArrowUpRight,
  ArrowDownRight, Users, List, Grid
} from 'lucide-react';

const CaisseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [caisse, setCaisse] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMouvements, setLoadingMouvements] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMouvementModal, setShowAddMouvementModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mouvementForm, setMouvementForm] = useState({
    type_mouvement: 'entree',
    montant: '',
    description: '',
    date_mouvement: new Date().toISOString().split('T')[0],
    transaction: ''
  });

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

      // Charger la caisse
      const caisseRes = await axiosInstance.get(`/caisses/${id}/`, headers);
      setCaisse(caisseRes.data);

      // Charger les mouvements
      setLoadingMouvements(true);
      try {
        const mouvementsRes = await axiosInstance.get(`/caisses/${id}/mouvements/`, headers);
        let data = [];
        if (Array.isArray(mouvementsRes.data)) {
          data = mouvementsRes.data;
        } else if (mouvementsRes.data?.results) {
          data = mouvementsRes.data.results;
        }
        setMouvements(data);
      } catch (mouvError) {
        console.warn('⚠️ Erreur chargement mouvements:', mouvError);
      } finally {
        setLoadingMouvements(false);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Caisse non trouvée');
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
      setError('ID de caisse manquant');
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
      await axiosInstance.delete(`/caisses/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Caisse supprimée avec succès', 'success');
      setTimeout(() => navigate('/caisses'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // AJOUTER MOUVEMENT
  // ============================================================
  const handleAddMouvement = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // Validation
      if (!mouvementForm.montant || parseFloat(mouvementForm.montant) <= 0) {
        showNotification('Le montant doit être supérieur à 0', 'error');
        setIsAdding(false);
        return;
      }
      if (!mouvementForm.description.trim()) {
        showNotification('La description est obligatoire', 'error');
        setIsAdding(false);
        return;
      }

      const payload = {
        type_mouvement: mouvementForm.type_mouvement,
        montant: parseFloat(mouvementForm.montant),
        description: mouvementForm.description.trim(),
        date_mouvement: mouvementForm.date_mouvement,
        transaction: mouvementForm.transaction || null
      };

      await axiosInstance.post(`/caisses/${id}/ajouter_mouvement/`, payload, headers);
      showNotification('Mouvement ajouté avec succès', 'success');
      setShowAddMouvementModal(false);
      setMouvementForm({
        type_mouvement: 'entree',
        montant: '',
        description: '',
        date_mouvement: new Date().toISOString().split('T')[0],
        transaction: ''
      });
      fetchData();

    } catch (error) {
      console.error('❌ Erreur ajout mouvement:', error);
      showNotification('Erreur lors de l\'ajout du mouvement', 'error');
    } finally {
      setIsAdding(false);
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
    return type === 'entree' ? 'Entrée' : 'Sortie';
  };

  const getTypeColor = (type) => {
    return type === 'entree' ? 'badge-success' : 'badge-error';
  };

  const getTypeIcon = (type) => {
    return type === 'entree' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">{error}</h3>
          <button onClick={() => navigate('/caisses')} className="btn btn-primary mt-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  if (!caisse) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/caisses')} className="btn btn-primary mt-6 gap-2">
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
    <div className="space-y-4 p-4 lg:p-6 bg-gray-50 min-h-screen">
      
      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
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
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette caisse ?</p>
              <p className="font-semibold text-error mt-2">{caisse.nom}</p>
              <p className="text-sm text-gray-500">{formatCurrency(caisse.solde_actuel)}</p>
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

      {/* MODAL AJOUT MOUVEMENT */}
      {showAddMouvementModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Ajouter un mouvement
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowAddMouvementModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddMouvement}>
              <div className="space-y-4">
                <div>
                  <label className="label font-medium">Type de mouvement</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type_mouvement"
                        value="entree"
                        checked={mouvementForm.type_mouvement === 'entree'}
                        onChange={(e) => setMouvementForm(prev => ({ ...prev, type_mouvement: e.target.value }))}
                        className="radio radio-success"
                      />
                      <span className="text-success">Entrée</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type_mouvement"
                        value="sortie"
                        checked={mouvementForm.type_mouvement === 'sortie'}
                        onChange={(e) => setMouvementForm(prev => ({ ...prev, type_mouvement: e.target.value }))}
                        className="radio radio-error"
                      />
                      <span className="text-error">Sortie</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label font-medium">Montant (FCFA) *</label>
                  <input
                    type="number"
                    value={mouvementForm.montant}
                    onChange={(e) => setMouvementForm(prev => ({ ...prev, montant: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="100"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label font-medium">Description *</label>
                  <input
                    type="text"
                    value={mouvementForm.description}
                    onChange={(e) => setMouvementForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du mouvement..."
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label font-medium">Date du mouvement</label>
                  <input
                    type="date"
                    value={mouvementForm.date_mouvement}
                    onChange={(e) => setMouvementForm(prev => ({ ...prev, date_mouvement: e.target.value }))}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowAddMouvementModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={isAdding}>
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isAdding ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/caisses')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{caisse.nom}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className={`badge ${caisse.est_active ? 'badge-success' : 'badge-error'}`}>
                    {caisse.est_active ? 'Active' : 'Inactive'}
                  </span>
                  <span>{getTypeLabel(caisse.type_caisse)}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button onClick={fetchData} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAddMouvementModal(true)} className="btn btn-sm btn-success gap-2">
              <Plus className="w-4 h-4" /> Mouvement
            </button>
            <button onClick={() => navigate(`/caisses/${id}/modifier`)} className="btn btn-sm btn-primary gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm btn-error gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* SOLDE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase">Solde initial</p>
            <p className="text-xl font-bold text-gray-700">{formatCurrency(caisse.solde_initial)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Solde actuel</p>
            <p className={`text-2xl font-bold ${parseFloat(caisse.solde_actuel) >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(caisse.solde_actuel)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Responsable</p>
            <p className="text-lg font-bold text-gray-700">{caisse.responsable_nom || '-'}</p>
          </div>
        </div>
      </div>

      {/* MOUVEMENTS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-700">
              Mouvements ({mouvements.length})
            </h3>
          </div>
          {loadingMouvements && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>

        {loadingMouvements ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun mouvement</p>
            <button onClick={() => setShowAddMouvementModal(true)} className="btn btn-primary btn-sm mt-3 gap-2">
              <Plus className="w-4 h-4" /> Ajouter un mouvement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50 text-sm">
                  <th className="py-3 font-semibold">Date</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 font-semibold text-right">Montant</th>
                  <th className="py-3 font-semibold">Description</th>
                  <th className="py-3 font-semibold hidden md:table-cell">Créé par</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 text-sm">{formatDate(m.date_mouvement)}</td>
                    <td className="py-3">
                      <span className={`badge ${getTypeColor(m.type_mouvement)} gap-1`}>
                        {getTypeIcon(m.type_mouvement)}
                        {getTypeLabel(m.type_mouvement)}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${m.type_mouvement === 'entree' ? 'text-success' : 'text-error'}`}>
                      {m.type_mouvement === 'entree' ? '+' : '-'} {formatCurrency(m.montant)}
                    </td>
                    <td className="py-3 text-sm">{m.description}</td>
                    <td className="py-3 text-sm hidden md:table-cell">{m.cree_par?.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AUDIT */}
      <div className="text-xs text-gray-400 text-center py-2">
        Créé le {formatDateTime(caisse.date_creation)} • Modifié le {formatDateTime(caisse.date_modification)}
      </div>
    </div>
  );
};

export default CaisseDetail;