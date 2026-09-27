// src/components/gestion/NiveauTarifForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, Layers, RefreshCw, ArrowLeft,
  CheckCircle, AlertCircle, Trash2, Calendar,
  DollarSign, BookOpen, Home, Award, School,
  Bus, Coffee, Library, Activity, Percent,
  Users, TrendingUp, Clock, Settings
} from 'lucide-react';

const NiveauTarifForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

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
    remise_boursier: 0,
    etablissement: '',
  });
  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [totalAnnuel, setTotalAnnuel] = useState(0);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Charger les données
  const loadData = async () => {
    try {
      const [niveauxRes, anneesRes, etabRes] = await Promise.all([
        axiosInstance.get('/niveaux/'),
        axiosInstance.get('/annees-scolaires/'),
        axiosInstance.get('/etablissements/')
      ]);
      setNiveaux(niveauxRes.data || []);
      setAnnees(anneesRes.data || []);
      setEtablissements(etabRes.data || []);
      
      // Sélectionner l'établissement par défaut
      if (etabRes.data?.length > 0 && !isEditMode) {
        setFormData(prev => ({ ...prev, etablissement: etabRes.data[0].id }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Impossible de charger les données', 'error');
    }
  };

  // Charger un tarif existant
  const loadTarif = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/niveaux-tarifs/${id}/`);
      const tarif = response.data;
      setFormData({
        niveau: tarif.niveau || '',
        annee_scolaire: tarif.annee_scolaire || '',
        frais_inscription: parseFloat(tarif.frais_inscription) || 0,
        mensualite_base: parseFloat(tarif.mensualite_base) || 0,
        nombre_mensualites: tarif.nombre_mensualites || 10,
        frais_transport: parseFloat(tarif.frais_transport) || 0,
        frais_cantine: parseFloat(tarif.frais_cantine) || 0,
        frais_bibliotheque: parseFloat(tarif.frais_bibliotheque) || 0,
        frais_activite: parseFloat(tarif.frais_activite) || 0,
        remise_fratrie: parseFloat(tarif.remise_fratrie) || 0,
        remise_ancien: parseFloat(tarif.remise_ancien) || 0,
        remise_boursier: parseFloat(tarif.remise_boursier) || 0,
        etablissement: tarif.etablissement || '',
      });
      calculateTotal(tarif);
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
      await loadData();
      await loadTarif();
    };
    init();
  }, [id]);

  const calculateTotal = (data) => {
    const inscription = parseFloat(data.frais_inscription) || 0;
    const mensualite = parseFloat(data.mensualite_base) || 0;
    const nbMens = parseInt(data.nombre_mensualites) || 10;
    const total = inscription + (mensualite * nbMens);
    setTotalAnnuel(total);
    return total;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: parsedValue };
      // Recalculer le total annuel
      if (['frais_inscription', 'mensualite_base', 'nombre_mensualites'].includes(name)) {
        calculateTotal(newData);
      }
      return newData;
    });
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.niveau) newErrors.niveau = 'Le niveau est requis';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
    if (!formData.etablissement) newErrors.etablissement = 'L\'établissement est requis';
    if (formData.frais_inscription < 0) newErrors.frais_inscription = 'Le montant doit être positif';
    if (formData.mensualite_base < 0) newErrors.mensualite_base = 'Le montant doit être positif';
    if (formData.nombre_mensualites < 1) newErrors.nombre_mensualites = 'Le nombre doit être supérieur à 0';
    if (formData.remise_fratrie < 0 || formData.remise_fratrie > 100) 
      newErrors.remise_fratrie = 'La remise doit être entre 0 et 100%';
    if (formData.remise_ancien < 0 || formData.remise_ancien > 100) 
      newErrors.remise_ancien = 'La remise doit être entre 0 et 100%';
    if (formData.remise_boursier < 0 || formData.remise_boursier > 100) 
      newErrors.remise_boursier = 'La remise doit être entre 0 et 100%';
    
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
        niveau: formData.niveau,
        annee_scolaire: formData.annee_scolaire,
        frais_inscription: formData.frais_inscription,
        mensualite_base: formData.mensualite_base,
        nombre_mensualites: formData.nombre_mensualites,
        frais_transport: formData.frais_transport,
        frais_cantine: formData.frais_cantine,
        frais_bibliotheque: formData.frais_bibliotheque,
        frais_activite: formData.frais_activite,
        remise_fratrie: formData.remise_fratrie,
        remise_ancien: formData.remise_ancien,
        remise_boursier: formData.remise_boursier,
        etablissement: formData.etablissement,
      };

      if (isEditMode) {
        await axiosInstance.put(`/niveaux-tarifs/${id}/`, payload);
        showNotification('Tarif modifié avec succès', 'success');
      } else {
        await axiosInstance.post('/niveaux-tarifs/', payload);
        showNotification('Tarif créé avec succès', 'success');
      }

      setTimeout(() => navigate('/niveaux-tarifs'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response?.status === 400) {
        const details = Object.values(error.response.data).flat().join(' ');
        setErrors({ global: details });
        showNotification('Erreur de validation : ' + details, 'error');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value || 0);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      {/* Notification Toast */}
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

      <div className="w-full mx-auto">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier le tarif' : 'Nouveau tarif'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les tarifs pour ce niveau' : 'Définissez les tarifs pour un niveau scolaire'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Section principale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Niveau */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Niveau <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="niveau"
                      value={formData.niveau}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.niveau ? 'input-error' : ''}`}
                      disabled={isEditMode}
                    >
                      <option value="">Sélectionner un niveau</option>
                      {niveaux.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.nom} - {n.cycle}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.niveau && <span className="text-error text-xs mt-1">{errors.niveau}</span>}
                </div>

                {/* Année scolaire */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Année scolaire <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="annee_scolaire"
                      value={formData.annee_scolaire}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'input-error' : ''}`}
                      disabled={isEditMode}
                    >
                      <option value="">Sélectionner une année</option>
                      {annees.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.libelle} {a.est_active && '⭐ (Active)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.annee_scolaire && <span className="text-error text-xs mt-1">{errors.annee_scolaire}</span>}
                </div>

                {/* Établissement */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Établissement <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="etablissement"
                      value={formData.etablissement}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.etablissement ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner un établissement</option>
                      {etablissements.map(e => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                  </div>
                  {errors.etablissement && <span className="text-error text-xs mt-1">{errors.etablissement}</span>}
                </div>
              </div>

              {/* Frais principaux */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Frais principaux
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700">Frais d'inscription</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        name="frais_inscription"
                        value={formData.frais_inscription}
                        onChange={handleChange}
                        className={`input input-bordered w-full pl-10 ${errors.frais_inscription ? 'input-error' : ''}`}
                        step="100"
                        min="0"
                      />
                    </div>
                    {errors.frais_inscription && <span className="text-error text-xs mt-1">{errors.frais_inscription}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700">Mensualité de base</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        name="mensualite_base"
                        value={formData.mensualite_base}
                        onChange={handleChange}
                        className={`input input-bordered w-full pl-10 ${errors.mensualite_base ? 'input-error' : ''}`}
                        step="100"
                        min="0"
                      />
                    </div>
                    {errors.mensualite_base && <span className="text-error text-xs mt-1">{errors.mensualite_base}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700">Nombre de mensualités</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                </div>
              </div>

              {/* Autres frais */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Autres frais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Bus className="w-4 h-4" /> Transport
                      </span>
                    </label>
                    <input
                      type="number"
                      name="frais_transport"
                      value={formData.frais_transport}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      step="100"
                      min="0"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Coffee className="w-4 h-4" /> Cantine
                      </span>
                    </label>
                    <input
                      type="number"
                      name="frais_cantine"
                      value={formData.frais_cantine}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      step="100"
                      min="0"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Library className="w-4 h-4" /> Bibliothèque
                      </span>
                    </label>
                    <input
                      type="number"
                      name="frais_bibliotheque"
                      value={formData.frais_bibliotheque}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      step="100"
                      min="0"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Activity className="w-4 h-4" /> Activité
                      </span>
                    </label>
                    <input
                      type="number"
                      name="frais_activite"
                      value={formData.frais_activite}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Remises */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  Remises (%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Users className="w-4 h-4" /> Fratrie
                      </span>
                    </label>
                    <input
                      type="number"
                      name="remise_fratrie"
                      value={formData.remise_fratrie}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${errors.remise_fratrie ? 'input-error' : ''}`}
                      step="1"
                      min="0"
                      max="100"
                    />
                    {errors.remise_fratrie && <span className="text-error text-xs mt-1">{errors.remise_fratrie}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <Award className="w-4 h-4" /> Ancien élève
                      </span>
                    </label>
                    <input
                      type="number"
                      name="remise_ancien"
                      value={formData.remise_ancien}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${errors.remise_ancien ? 'input-error' : ''}`}
                      step="1"
                      min="0"
                      max="100"
                    />
                    {errors.remise_ancien && <span className="text-error text-xs mt-1">{errors.remise_ancien}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-700 flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> Boursier
                      </span>
                    </label>
                    <input
                      type="number"
                      name="remise_boursier"
                      value={formData.remise_boursier}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${errors.remise_boursier ? 'input-error' : ''}`}
                      step="1"
                      min="0"
                      max="100"
                    />
                    {errors.remise_boursier && <span className="text-error text-xs mt-1">{errors.remise_boursier}</span>}
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-gray-700">Total annuel :</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAnnuel)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(formData.frais_inscription)} + ({formatCurrency(formData.mensualite_base)} × {formData.nombre_mensualites})
                    </div>
                  </div>
                </div>
              </div>

              {/* Erreur globale */}
              {errors.global && (
                <div className="alert alert-error shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.global}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
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
                    <span className="loading loading-spinner loading-sm"></span>
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

        {/* Information supplémentaire */}
        {isEditMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Information</p>
                <p className="text-xs text-blue-600 mt-1">
                  La modification d'un tarif affecte les échéances et les factures générées pour les élèves de ce niveau.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NiveauTarifForm;