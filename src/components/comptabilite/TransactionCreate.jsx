// src/components/comptabilite/TransactionCreate.jsx
// Création d'une transaction pour un compte client

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

// ✅ Importer les icônes une par une pour éviter les problèmes
import { 
  ArrowLeft, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  Wallet,
  RefreshCw, 
  Info 
} from 'lucide-react';

const TransactionCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // ============================================================
  // FORMULAIRE
  // ============================================================
  const [formData, setFormData] = useState({
    type_transaction: 'credit',
    categorie: 'mensualite',
    montant: '',
    description: '',
    date_transaction: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: 'especes',
    reference_paiement: '',
    est_valide: true
  });

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DU COMPTE
  // ============================================================
  const fetchCompte = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await axiosInstance.get(`/comptes-clients/${id}/`);
      setCompte(response.data);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Compte client non trouvé', 'error');
        setTimeout(() => navigate('/comptes-clients'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompte();
    }
  }, [id]);

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    if (!formData.type_transaction) {
      newErrors.type_transaction = 'Le type de transaction est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // ✅ Données sans etablissement
      const dataToSend = {
        compte_client: parseInt(id),
        type_transaction: formData.type_transaction,
        categorie: formData.categorie,
        montant: parseFloat(formData.montant),
        description: formData.description.trim(),
        date_transaction: formData.date_transaction,
        est_valide: formData.est_valide
      };

      // ✅ Ajouter date_echeance seulement si elle est remplie
      if (formData.date_echeance) {
        dataToSend.date_echeance = formData.date_echeance;
      }

      // ✅ Ajouter mode_paiement seulement si c'est un crédit
      if (formData.type_transaction === 'credit' && formData.mode_paiement) {
        dataToSend.mode_paiement = formData.mode_paiement;
      }

      // ✅ Ajouter reference_paiement seulement si elle est remplie
      if (formData.reference_paiement && formData.reference_paiement.trim()) {
        dataToSend.reference_paiement = formData.reference_paiement.trim();
      }

      console.log('📤 Envoi des données:', JSON.stringify(dataToSend, null, 2));

      const response = await axiosInstance.post('/transactions/', dataToSend);

      console.log('✅ Réponse:', response.data);

      showNotification('Transaction créée avec succès', 'success');
      
      setTimeout(() => {
        navigate(`/comptes-clients/${id}`);
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur création:', error);
      
      if (error.response) {
        console.error('📦 Réponse du serveur:', error.response.data);
        console.error('📦 Status:', error.response.status);
        
        if (error.response.status === 400) {
          const errorData = error.response.data;
          let errorMessages = [];
          
          if (typeof errorData === 'object') {
            Object.keys(errorData).forEach(key => {
              const value = errorData[key];
              if (Array.isArray(value)) {
                errorMessages.push(`${key}: ${value.join(', ')}`);
              } else if (typeof value === 'string') {
                errorMessages.push(`${key}: ${value}`);
              }
            });
            showNotification(`Erreur: ${errorMessages.join(' | ')}`, 'error');
            setErrors(errorData);
          } else {
            showNotification(errorData || 'Données invalides', 'error');
          }
        } else if (error.response.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 403) {
          showNotification('Vous n\'avez pas la permission', 'error');
        } else {
          showNotification(`Erreur ${error.response.status}: ${error.response.statusText}`, 'error');
        }
      } else if (error.request) {
        console.error('❌ Pas de réponse du serveur:', error.request);
        showNotification('Le serveur ne répond pas. Vérifiez que Django est démarré.', 'error');
      } else {
        showNotification('Erreur lors de la création de la transaction', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ANNULER
  // ============================================================
  const handleCancel = () => {
    navigate(`/comptes-clients/${id}`);
  };

  // ============================================================
  // TYPES
  // ============================================================
  const typesTransaction = [
    { value: 'credit', label: 'Crédit (Paiement)' },
    { value: 'debit', label: 'Débit (Dû)' }
  ];

  const categories = [
    { value: 'inscription', label: 'Frais d\'inscription' },
    { value: 'mensualite', label: 'Mensualité' },
    { value: 'scolarite', label: 'Scolarité' },
    { value: 'transport', label: 'Transport' },
    { value: 'cantine', label: 'Cantine' },
    { value: 'bibliotheque', label: 'Bibliothèque' },
    { value: 'activite', label: 'Activité parascolaire' },
    { value: 'salaire', label: 'Salaire' },
    { value: 'fourniture', label: 'Fourniture' },
    { value: 'entretien', label: 'Entretien' },
    { value: 'equipement', label: 'Équipement' },
    { value: 'taxe', label: 'Taxe' },
    { value: 'assurance', label: 'Assurance' },
    { value: 'remise', label: 'Remise' },
    { value: 'annulation', label: 'Annulation' },
    { value: 'autre', label: 'Autre' }
  ];

  const modesPaiement = [
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'virement', label: 'Virement' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'mobile', label: 'Mobile Money' },
    { value: 'transfert', label: 'Transfert' },
    { value: 'autre', label: 'Autre' }
  ];

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
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
            Chargement du compte client...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen w-full">
      
      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl text-sm sm:text-base rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
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

      {/* EN-TÊTE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCancel}
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Nouvelle transaction</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {compte?.prenom || ''} {compte?.nom || ''} - {compte?.matricule || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* INFORMATIONS GÉNÉRALES */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" /> Informations générales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Type <span className="text-error">*</span></span>
                </label>
                <select
                  name="type_transaction"
                  value={formData.type_transaction}
                  onChange={handleChange}
                  className={`select select-bordered w-full dark:bg-gray-700 dark:text-white ${errors.type_transaction ? 'select-error' : ''}`}
                >
                  {typesTransaction.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.type_transaction && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.type_transaction}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Catégorie</span>
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="select select-bordered w-full dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Montant <span className="text-error">*</span></span>
                </label>
                <input
                  type="number"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="100"
                  className={`input input-bordered w-full dark:bg-gray-700 dark:text-white ${errors.montant ? 'input-error' : ''}`}
                />
                {errors.montant && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.montant}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* DATES ET DESCRIPTION */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" /> Dates et description
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Date de transaction</span>
                </label>
                <input
                  type="date"
                  name="date_transaction"
                  value={formData.date_transaction}
                  onChange={handleChange}
                  className="input input-bordered w-full dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Date d'échéance</span>
                </label>
                <input
                  type="date"
                  name="date_echeance"
                  value={formData.date_echeance}
                  onChange={handleChange}
                  className="input input-bordered w-full dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Validé</span>
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="est_valide"
                      checked={formData.est_valide}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm dark:text-gray-300">Valider immédiatement</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text font-medium dark:text-gray-300">Description <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description de la transaction"
                className={`input input-bordered w-full dark:bg-gray-700 dark:text-white ${errors.description ? 'input-error' : ''}`}
              />
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.description}</span>
                </label>
              )}
            </div>
          </div>

          {/* PAIEMENT */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-primary" /> Informations de paiement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Mode de paiement</span>
                </label>
                <select
                  name="mode_paiement"
                  value={formData.mode_paiement}
                  onChange={handleChange}
                  className="select select-bordered w-full dark:bg-gray-700 dark:text-white"
                >
                  {modesPaiement.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium dark:text-gray-300">Référence paiement</span>
                </label>
                <input
                  type="text"
                  name="reference_paiement"
                  value={formData.reference_paiement}
                  onChange={handleChange}
                  placeholder="N° chèque, virement..."
                  className="input input-bordered w-full dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RÉSUMÉ DU COMPTE */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mt-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Client :</span>
              <span className="font-medium ml-2 dark:text-white">{compte?.prenom || ''} {compte?.nom || ''}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Matricule :</span>
              <span className="font-mono font-medium ml-2 dark:text-white">{compte?.matricule || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Solde actuel :</span>
              <span className={`font-bold ml-2 ${parseFloat(compte?.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
                {formatCurrency(compte?.solde || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Situation :</span>
              <span className={`badge ${compte?.situation === 'normal' ? 'badge-success' : 'badge-error'} ml-2`}>
                {compte?.situation === 'normal' ? 'Normal' : 'En retard'}
              </span>
            </div>
          </div>
        </div>

        {/* BOUTONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-ghost gap-2"
            disabled={saving}
          >
            <X className="w-4 h-4" /> Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionCreate;