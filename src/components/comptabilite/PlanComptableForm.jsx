// src/components/comptabilite/PlanComptableForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle, CheckCircle,
  BookOpen, Tag, Hash, Layers, FileText, Info,
  Trash2, Eye, EyeOff, Wifi, WifiOff
} from 'lucide-react';

const PlanComptableForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    categorie: 'actif',
    type: 'autre',
    parent: null,
    est_actif: true,
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [plansParents, setPlansParents] = useState([]);
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

        // Charger les comptes parents pour le select
        const parentsRes = await axiosInstance.get('/plan-comptable/', headers);
        let parents = [];
        if (Array.isArray(parentsRes.data)) {
          parents = parentsRes.data;
        } else if (parentsRes.data?.results) {
          parents = parentsRes.data.results;
        }
        setPlansParents(parents);

        // Si c'est une édition, charger les données
        if (isEditMode) {
          const planRes = await axiosInstance.get(`/plan-comptable/${id}/`, headers);
          const data = planRes.data;
          setFormData({
            code: data.code || '',
            nom: data.nom || '',
            categorie: data.categorie || 'actif',
            type: data.type || 'autre',
            parent: data.parent || null,
            est_actif: data.est_actif !== undefined ? data.est_actif : true,
            description: data.description || ''
          });
        }

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 404) {
          setError('Compte comptable non trouvé');
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
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
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
      if (!formData.code.trim()) {
        setError('Le code est obligatoire');
        setSaving(false);
        return;
      }
      if (!formData.nom.trim()) {
        setError('Le nom est obligatoire');
        setSaving(false);
        return;
      }

      const payload = {
        code: formData.code.trim().toUpperCase(),
        nom: formData.nom.trim(),
        categorie: formData.categorie,
        type: formData.type,
        parent: formData.parent || null,
        est_actif: formData.est_actif,
        description: formData.description.trim() || ''
      };

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/plan-comptable/${id}/`, payload, headers);
        showNotification('Compte mis à jour avec succès', 'success');
      } else {
        response = await axiosInstance.post('/plan-comptable/', payload, headers);
        showNotification('Compte créé avec succès', 'success');
      }

      setTimeout(() => navigate('/plan-comptable'), 1500);

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
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            {isEditMode ? 'Chargement du compte...' : 'Préparation du formulaire...'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error && !formData.code) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">Erreur</h3>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/plan-comptable')} className="btn btn-primary gap-2">
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
              onClick={() => navigate('/plan-comptable')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {isEditMode ? 'Modifier le compte' : 'Nouveau compte comptable'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode ? `Modification du compte ${formData.code}` : 'Ajouter un nouveau compte au plan comptable'}
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
            
            {/* Code */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" /> Code comptable <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Ex: 401, 411, 512..."
                className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all ${error?.includes('code') ? 'input-error' : ''}`}
                required
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Code unique du compte (ex: 401 pour Fournisseurs)</span>
              </label>
            </div>

            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Nom <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Fournisseurs, Clients, Banque..."
                className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all ${error?.includes('nom') ? 'input-error' : ''}`}
                required
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Libellé du compte comptable</span>
              </label>
            </div>

            {/* Catégorie */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Catégorie <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
              >
                <option value="actif">Actif</option>
                <option value="passif">Passif</option>
                <option value="charge">Charge</option>
                <option value="produit">Produit</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Catégorie comptable du compte</span>
              </label>
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Type <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
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
                <option value="autre">Autre</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Type de transaction associée</span>
              </label>
            </div>

            {/* Compte parent */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Compte parent
                </span>
              </label>
              <select
                name="parent"
                value={formData.parent || ''}
                onChange={(e) => handleSelectChange('parent', e.target.value || null)}
                className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
              >
                <option value="">Aucun parent</option>
                {plansParents
                  .filter(p => p.id !== parseInt(id)) // Éviter l'auto-référence en édition
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.nom}</option>
                  ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-400">Compte parent dans la hiérarchie</span>
              </label>
            </div>

            {/* Description */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Description
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description détaillée du compte..."
                className="textarea textarea-bordered w-full h-24 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={saving}
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Description facultative du compte</span>
              </label>
            </div>

            {/* Statut */}
            <div className="form-control md:col-span-2">
              <label className="label cursor-pointer justify-start gap-4">
                <span className="label-text font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Statut
                </span>
                <input
                  type="checkbox"
                  name="est_actif"
                  checked={formData.est_actif}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                  disabled={saving}
                />
                <span className="text-sm">
                  {formData.est_actif ? (
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Actif
                    </span>
                  ) : (
                    <span className="text-error flex items-center gap-1">
                      <X className="w-4 h-4" /> Inactif
                    </span>
                  )}
                </span>
              </label>
              <label className="label">
                <span className="label-text-alt text-gray-400">Un compte inactif n'apparaîtra plus dans les listes</span>
              </label>
            </div>

          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/plan-comptable')}
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
                  {isEditMode ? 'Mettre à jour' : 'Créer le compte'}
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

export default PlanComptableForm;