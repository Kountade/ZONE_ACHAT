// src/comptabilite/NiveauxTarifForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Save,
  X,
  Loader2,
  DollarSign,
  Percent,
  School,
  Calendar,
  Bus,
  Utensils,
  BookOpen,
  Users,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import toast from 'react-hot-toast';

const NiveauxTarifForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const tarifFromState = location.state?.tarif;

  const [formData, setFormData] = useState({
    niveau: '',
    annee_scolaire: '',
    frais_inscription: 0,
    mensualite_base: 0,
    nombre_mensualites: 10,
    frais_transport: 0,
    frais_cantine: 0,
    frais_bibliotheque: 0,
    frais_activite: 0,
    remise_fratrie: 0,
    remise_ancien: 0,
    remise_boursier: 0
  });

  // Notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Charger les références
  const loadReferences = async () => {
    try {
      const [niveauxRes, anneesRes] = await Promise.all([
        AxiosInstance.get('/niveaux/'),
        AxiosInstance.get('/annees-scolaires/')
      ]);
      
      setNiveaux(niveauxRes.data || []);
      setAnnees(anneesRes.data || []);
      
      // Définir l'année active par défaut
      const anneeActive = anneesRes.data?.find(a => a.est_active === true);
      if (anneeActive && !isEditMode) {
        setFormData(prev => ({ ...prev, annee_scolaire: anneeActive.id }));
      }
    } catch (error) {
      console.error('Erreur chargement références:', error);
      showNotification('Impossible de charger les données de référence', 'error');
    }
  };

  // Charger un tarif existant
  const loadTarif = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    if (tarifFromState) {
      setFormData({
        niveau: tarifFromState.niveau || tarifFromState.niveau_id || '',
        annee_scolaire: tarifFromState.annee_scolaire || tarifFromState.annee_scolaire_id || '',
        frais_inscription: tarifFromState.frais_inscription || 0,
        mensualite_base: tarifFromState.mensualite_base || 0,
        nombre_mensualites: tarifFromState.nombre_mensualites || 10,
        frais_transport: tarifFromState.frais_transport || 0,
        frais_cantine: tarifFromState.frais_cantine || 0,
        frais_bibliotheque: tarifFromState.frais_bibliotheque || 0,
        frais_activite: tarifFromState.frais_activite || 0,
        remise_fratrie: tarifFromState.remise_fratrie || 0,
        remise_ancien: tarifFromState.remise_ancien || 0,
        remise_boursier: tarifFromState.remise_boursier || 0
      });
      setFetching(false);
      return;
    }

    try {
      const response = await AxiosInstance.get(`/niveaux-tarifs/${id}/`);
      const tarif = response.data;
      setFormData({
        niveau: tarif.niveau || '',
        annee_scolaire: tarif.annee_scolaire || '',
        frais_inscription: tarif.frais_inscription || 0,
        mensualite_base: tarif.mensualite_base || 0,
        nombre_mensualites: tarif.nombre_mensualites || 10,
        frais_transport: tarif.frais_transport || 0,
        frais_cantine: tarif.frais_cantine || 0,
        frais_bibliotheque: tarif.frais_bibliotheque || 0,
        frais_activite: tarif.frais_activite || 0,
        remise_fratrie: tarif.remise_fratrie || 0,
        remise_ancien: tarif.remise_ancien || 0,
        remise_boursier: tarif.remise_boursier || 0
      });
    } catch (error) {
      console.error('Erreur chargement tarif:', error);
      if (error.response?.status === 404) {
        showNotification('Tarif non trouvé', 'error');
        navigate('/niveaux-tarifs');
      } else {
        showNotification('Impossible de charger le tarif', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadReferences();
      await loadTarif();
    };
    init();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.niveau) newErrors.niveau = 'Veuillez sélectionner un niveau';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'Veuillez sélectionner une année scolaire';
    if (formData.frais_inscription < 0) newErrors.frais_inscription = 'Le montant doit être positif';
    if (formData.mensualite_base < 0) newErrors.mensualite_base = 'Le montant doit être positif';
    if (formData.nombre_mensualites < 1 || formData.nombre_mensualites > 12) {
      newErrors.nombre_mensualites = 'Le nombre de mensualités doit être entre 1 et 12';
    }
    if (formData.remise_fratrie < 0 || formData.remise_fratrie > 100) {
      newErrors.remise_fratrie = 'La remise doit être entre 0 et 100%';
    }
    if (formData.remise_ancien < 0 || formData.remise_ancien > 100) {
      newErrors.remise_ancien = 'La remise doit être entre 0 et 100%';
    }
    if (formData.remise_boursier < 0 || formData.remise_boursier > 100) {
      newErrors.remise_boursier = 'La remise doit être entre 0 et 100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        niveau: parseInt(formData.niveau),
        annee_scolaire: parseInt(formData.annee_scolaire),
        frais_inscription: parseFloat(formData.frais_inscription) || 0,
        mensualite_base: parseFloat(formData.mensualite_base) || 0,
        nombre_mensualites: parseInt(formData.nombre_mensualites) || 10,
        frais_transport: parseFloat(formData.frais_transport) || 0,
        frais_cantine: parseFloat(formData.frais_cantine) || 0,
        frais_bibliotheque: parseFloat(formData.frais_bibliotheque) || 0,
        frais_activite: parseFloat(formData.frais_activite) || 0,
        remise_fratrie: parseFloat(formData.remise_fratrie) || 0,
        remise_ancien: parseFloat(formData.remise_ancien) || 0,
        remise_boursier: parseFloat(formData.remise_boursier) || 0,
        etablissement: 1
      };

      if (isEditMode) {
        await AxiosInstance.put(`/niveaux-tarifs/${id}/`, payload);
        showNotification('Tarif modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/niveaux-tarifs/', payload);
        showNotification('Tarif créé avec succès', 'success');
      }

      setTimeout(() => navigate('/niveaux-tarifs'), 1500);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        showNotification('Impossible de contacter le serveur. Vérifiez que Django est en cours d\'exécution.', 'error');
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            const msg = Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key];
            setErrors(prev => ({ ...prev, [key]: msg }));
          });
          showNotification('Erreur de validation', 'error');
        } else {
          showNotification(errorData || 'Erreur de validation', 'error');
        }
      } else if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        navigate('/login');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission', 'error');
      } else if (error.response?.status === 409) {
        showNotification('Un tarif existe déjà pour ce niveau et cette année', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calcul du total annuel
  const totalAnnuel = (parseFloat(formData.frais_inscription) || 0) + 
                      (parseFloat(formData.mensualite_base) || 0) * 
                      (parseInt(formData.nombre_mensualites) || 10);

  const selectedNiveau = niveaux.find(n => n.id === parseInt(formData.niveau));
  const selectedAnnee = annees.find(a => a.id === parseInt(formData.annee_scolaire));

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl`}>
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

      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/niveaux-tarifs')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {isEditMode ? 'Modifier le tarif' : 'Nouveau tarif'}
              </h1>
            </div>
            <p className="text-sm text-base-content/60 mt-1 ml-1">
              {isEditMode 
                ? `Modification du tarif pour ${selectedNiveau?.nom || ''}`
                : 'Création d\'un nouveau tarif par niveau'
              }
            </p>
          </div>
          {isEditMode && selectedNiveau && selectedAnnee && (
            <span className="badge badge-primary badge-lg">
              {selectedNiveau.nom} - {selectedAnnee.libelle}
            </span>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Niveau */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Niveau <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <select
                    name="niveau"
                    value={formData.niveau}
                    onChange={handleChange}
                    className={`select select-bordered w-full pl-10 ${errors.niveau ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner un niveau</option>
                    {niveaux.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.nom} ({n.cycle || 'Sans cycle'})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.niveau && <span className="text-error text-xs mt-1">{errors.niveau}</span>}
              </div>

              {/* Année scolaire */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Année scolaire <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <select
                    name="annee_scolaire"
                    value={formData.annee_scolaire}
                    onChange={handleChange}
                    className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'select-error' : ''}`}
                  >
                    <option value="">Sélectionner une année</option>
                    {annees.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.libelle} {a.est_active ? '⭐ (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.annee_scolaire && <span className="text-error text-xs mt-1">{errors.annee_scolaire}</span>}
              </div>

              {/* Nombre mensualités */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Nombre de mensualités</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="nombre_mensualites"
                    value={formData.nombre_mensualites}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.nombre_mensualites ? 'input-error' : ''}`}
                    min="1"
                    max="12"
                  />
                </div>
                {errors.nombre_mensualites && <span className="text-error text-xs mt-1">{errors.nombre_mensualites}</span>}
              </div>

              {/* Frais d'inscription */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Frais d'inscription (FCFA)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="frais_inscription"
                    value={formData.frais_inscription}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.frais_inscription ? 'input-error' : ''}`}
                    min="0"
                    step="1000"
                  />
                </div>
                {errors.frais_inscription && <span className="text-error text-xs mt-1">{errors.frais_inscription}</span>}
              </div>

              {/* Mensualité de base */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Mensualité de base (FCFA)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="mensualite_base"
                    value={formData.mensualite_base}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.mensualite_base ? 'input-error' : ''}`}
                    min="0"
                    step="1000"
                  />
                </div>
                {errors.mensualite_base && <span className="text-error text-xs mt-1">{errors.mensualite_base}</span>}
              </div>

              {/* Total annuel (calculé) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Total annuel (FCFA)</span>
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <div className="input input-bordered w-full pl-10 bg-base-200 font-bold text-primary">
                    {totalAnnuel.toLocaleString()} FCFA
                  </div>
                </div>
              </div>

              {/* Frais de transport */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Frais de transport (FCFA)</span>
                </label>
                <div className="relative">
                  <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="frais_transport"
                    value={formData.frais_transport}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              {/* Frais de cantine */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Frais de cantine (FCFA)</span>
                </label>
                <div className="relative">
                  <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="frais_cantine"
                    value={formData.frais_cantine}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              {/* Frais de bibliothèque */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Frais de bibliothèque (FCFA)</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="frais_bibliotheque"
                    value={formData.frais_bibliotheque}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              {/* Frais d'activité */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Frais d'activité (FCFA)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="frais_activite"
                    value={formData.frais_activite}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              {/* Remise fratrie */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Remise fratrie (%)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="remise_fratrie"
                    value={formData.remise_fratrie}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.remise_fratrie ? 'input-error' : ''}`}
                    min="0"
                    max="100"
                  />
                </div>
                {errors.remise_fratrie && <span className="text-error text-xs mt-1">{errors.remise_fratrie}</span>}
              </div>

              {/* Remise ancien élève */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Remise ancien élève (%)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="remise_ancien"
                    value={formData.remise_ancien}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.remise_ancien ? 'input-error' : ''}`}
                    min="0"
                    max="100"
                  />
                </div>
                {errors.remise_ancien && <span className="text-error text-xs mt-1">{errors.remise_ancien}</span>}
              </div>

              {/* Remise boursier */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Remise boursier (%)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="number"
                    name="remise_boursier"
                    value={formData.remise_boursier}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.remise_boursier ? 'input-error' : ''}`}
                    min="0"
                    max="100"
                  />
                </div>
                {errors.remise_boursier && <span className="text-error text-xs mt-1">{errors.remise_boursier}</span>}
              </div>

              {/* Récapitulatif */}
              <div className="p-4 bg-base-200 rounded-lg border border-base-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-base-content/60">Total annuel</p>
                  <p className="text-lg font-bold text-primary">{totalAnnuel.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Total mensualités</p>
                  <p className="text-lg font-bold">
                    {((parseFloat(formData.mensualite_base) || 0) * (parseInt(formData.nombre_mensualites) || 10)).toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Frais annexes</p>
                  <p className="text-lg font-bold">
                    {((parseFloat(formData.frais_transport) || 0) + 
                      (parseFloat(formData.frais_cantine) || 0) + 
                      (parseFloat(formData.frais_bibliotheque) || 0) + 
                      (parseFloat(formData.frais_activite) || 0)).toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Remise max</p>
                  <p className="text-lg font-bold text-success">
                    {Math.max(
                      parseFloat(formData.remise_fratrie) || 0, 
                      parseFloat(formData.remise_ancien) || 0, 
                      parseFloat(formData.remise_boursier) || 0
                    )}%
                  </p>
                </div>
              </div>

              {/* Erreur globale */}
              {errors.global && (
                <div className="alert alert-error shadow-lg mt-4">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.global}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 p-6 bg-base-200/50 border-t border-base-300">
              <button
                type="button"
                onClick={() => navigate('/niveaux-tarifs')}
                className="btn btn-ghost gap-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[120px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information supplémentaire pour l'édition */}
        {isEditMode && (
          <div className="mt-6 p-4 bg-info/10 rounded-xl border border-info/20">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-info/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-semibold text-info">Information</p>
                <p className="text-xs text-info/70 mt-1">
                  La modification d'un tarif peut affecter les comptes clients et les échéances associés.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NiveauxTarifForm;