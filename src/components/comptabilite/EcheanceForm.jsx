// src/components/comptabilite/EcheanceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle, CheckCircle,
  Calendar, DollarSign, User, Tag, FileText, Info,
  Clock, CreditCard, Wifi, WifiOff, Users
} from 'lucide-react';

const EcheanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    compte_client: '',
    categorie: 'mensualite',
    libelle: '',
    montant: '',
    date_echeance: '',
    statut: 'a_payer',
    numero_mensualite: '',
    transaction: null
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingClients, setLoadingClients] = useState(false);

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
  useEffect(() => {
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

        // Charger les clients
        setLoadingClients(true);
        try {
          const clientsRes = await axiosInstance.get('/comptes-clients/', headers);
          let clientsData = [];
          if (Array.isArray(clientsRes.data)) {
            clientsData = clientsRes.data;
          } else if (clientsRes.data?.results) {
            clientsData = clientsRes.data.results;
          }
          setClients(clientsData);
        } catch (clientsError) {
          console.warn('⚠️ Erreur chargement clients:', clientsError);
        } finally {
          setLoadingClients(false);
        }

        // Si c'est une édition, charger les données
        if (isEditMode) {
          const echeanceRes = await axiosInstance.get(`/echeances/${id}/`, headers);
          const data = echeanceRes.data;
          setFormData({
            compte_client: data.compte_client || '',
            categorie: data.categorie || 'mensualite',
            libelle: data.libelle || '',
            montant: data.montant || '',
            date_echeance: data.date_echeance || '',
            statut: data.statut || 'a_payer',
            numero_mensualite: data.numero_mensualite || '',
            transaction: data.transaction || null
          });
        }

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 404) {
          setError('Échéance non trouvée');
        } else {
          setError('Erreur de chargement des données');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate]);

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // Validation
      if (!formData.compte_client) {
        setError('Le client est obligatoire');
        setSaving(false);
        return;
      }
      if (!formData.libelle.trim()) {
        setError('Le libellé est obligatoire');
        setSaving(false);
        return;
      }
      if (!formData.montant || parseFloat(formData.montant) <= 0) {
        setError('Le montant doit être supérieur à 0');
        setSaving(false);
        return;
      }
      if (!formData.date_echeance) {
        setError('La date d\'échéance est obligatoire');
        setSaving(false);
        return;
      }

      const payload = {
        compte_client: formData.compte_client,
        categorie: formData.categorie,
        libelle: formData.libelle.trim(),
        montant: parseFloat(formData.montant),
        date_echeance: formData.date_echeance,
        statut: formData.statut,
        numero_mensualite: formData.numero_mensualite ? parseInt(formData.numero_mensualite) : null,
        transaction: formData.transaction || null
      };

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/echeances/${id}/`, payload, headers);
        showNotification('Échéance mise à jour avec succès', 'success');
      } else {
        response = await axiosInstance.post('/echeances/', payload, headers);
        showNotification('Échéance créée avec succès', 'success');
      }

      setTimeout(() => navigate('/echeances'), 1500);

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          setError(messages);
        } else {
          setError(errors || 'Erreur lors de la sauvegarde');
        }
      } else {
        setError('Erreur de connexion au serveur');
      }
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getClientLabel = (client) => {
    if (!client) return '';
    return `${client.prenom || ''} ${client.nom || ''} (${client.matricule || ''})`;
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
    return map[categorie] || categorie;
  };

  const getStatutLabel = (statut) => {
    const map = {
      a_payer: 'À payer',
      paye: 'Payé',
      en_retard: 'En retard',
      annule: 'Annulé'
    };
    return map[statut] || statut;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            {isEditMode ? 'Chargement de l\'échéance...' : 'Préparation du formulaire...'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error && !formData.libelle) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">Erreur</h3>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/echeances')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium">{notification.message}</span>
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
          EN-TÊTE
          ============================================================ */}
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
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {isEditMode ? 'Modifier l\'échéance' : 'Nouvelle échéance'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode ? `Modification de l'échéance ${formData.libelle}` : 'Ajouter une nouvelle échéance'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          FORMULAIRE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          
          {/* Erreur générale */}
          {error && (
            <div className="alert alert-error mb-6 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Erreur de validation</p>
                <p className="text-sm whitespace-pre-wrap">{error}</p>
              </div>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setError(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Client */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="compte_client"
                value={formData.compte_client}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving || loadingClients}
                required
              >
                <option value="">Sélectionner un client</option>
                {loadingClients ? (
                  <option value="" disabled>Chargement des clients...</option>
                ) : (
                  clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {getClientLabel(c)}
                    </option>
                  ))
                )}
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Client associé à l'échéance</span>
              </label>
            </div>

            {/* Libellé */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Libellé <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleChange}
                placeholder="Ex: Mensualité Septembre, Frais d'inscription..."
                className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Description de l'échéance</span>
              </label>
            </div>

            {/* Catégorie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Catégorie <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
                required
              >
                <option value="inscription">Frais d'inscription</option>
                <option value="mensualite">Mensualité</option>
                <option value="scolarite">Scolarité</option>
                <option value="transport">Transport</option>
                <option value="cantine">Cantine</option>
                <option value="bibliotheque">Bibliothèque</option>
                <option value="activite">Activité parascolaire</option>
                <option value="salaire">Salaire</option>
                <option value="fourniture">Fourniture</option>
                <option value="entretien">Entretien</option>
                <option value="equipement">Équipement</option>
                <option value="taxe">Taxe</option>
                <option value="assurance">Assurance</option>
                <option value="remise">Remise</option>
                <option value="annulation">Annulation</option>
                <option value="autre">Autre</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Type de la transaction</span>
              </label>
            </div>

            {/* Montant */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Montant <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="100"
                className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Montant en francs CFA (FCFA)</span>
              </label>
            </div>

            {/* Date d'échéance */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Date d'échéance <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleChange}
                className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Date limite de paiement</span>
              </label>
            </div>

            {/* Numéro de mensualité */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> N° Mensualité
                </span>
              </label>
              <input
                type="number"
                name="numero_mensualite"
                value={formData.numero_mensualite}
                onChange={handleChange}
                placeholder="Ex: 1, 2, 3..."
                min="1"
                className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Numéro de la mensualité (si applicable)</span>
              </label>
            </div>

            {/* Statut */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Statut
                </span>
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
              >
                <option value="a_payer">À payer</option>
                <option value="paye">Payé</option>
                <option value="en_retard">En retard</option>
                <option value="annule">Annulé</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Statut actuel de l'échéance</span>
              </label>
            </div>

          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/echeances')}
              className="btn btn-ghost gap-2"
              disabled={saving}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 flex-1 sm:flex-none min-w-[150px]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Mettre à jour' : 'Créer l\'échéance'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* ============================================================
          INFOS (en édition)
          ============================================================ */}
      {isEditMode && (
        <div className="text-xs text-gray-400 text-center py-2">
          ID: {id} • Modifié le {new Date().toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default EcheanceForm;