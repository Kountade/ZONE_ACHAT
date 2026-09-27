// src/components/gestion/GestionMatieresForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, BookOpen, ArrowLeft,
  CheckCircle, AlertCircle,
  Book, Hash, BarChart, Layers, Plus, Trash2
} from 'lucide-react';

const GestionMatieresForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    etablissement: null,
  });
  const [configurations, setConfigurations] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Charger la liste des niveaux
  const loadReferences = async () => {
    try {
      const response = await axiosInstance.get('/niveaux/');
      setNiveaux(response.data || []);
    } catch (error) {
      console.error('Erreur chargement niveaux:', error);
      showNotification('Impossible de charger les niveaux', 'error');
    }
  };

  // Charger une matière existante
  const loadMatiere = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/matieres/${id}/`);
      const matiere = response.data;
      
      setFormData({
        nom: matiere.nom || '',
        code: matiere.code || '',
        etablissement: matiere.etablissement || null,
      });

      // Charger les configurations existantes
      if (matiere.niveaux_config && matiere.niveaux_config.length > 0) {
        setConfigurations(matiere.niveaux_config.map(config => ({
          id: config.id,
          niveau_id: config.niveau,
          coefficient: config.coefficient,
          est_obligatoire: config.est_obligatoire,
          volume_horaire: config.volume_horaire
        })));
      }
    } catch (error) {
      console.error('Erreur chargement matière:', error);
      if (error.response?.status === 404) {
        showNotification('Matière non trouvée', 'error');
        navigate('/matieres');
      } else {
        showNotification('Impossible de charger la matière', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadReferences();
      await loadMatiere();
    };
    init();
  }, [id]);

  // Ajouter une configuration
  const addConfiguration = () => {
    // Trouver les niveaux disponibles (non encore configurés)
    const configuredNiveaux = configurations.map(c => c.niveau_id);
    const availableNiveaux = niveaux.filter(n => !configuredNiveaux.includes(n.id));
    
    if (availableNiveaux.length === 0) {
      showNotification('Tous les niveaux sont déjà configurés', 'error');
      return;
    }

    setConfigurations([
      ...configurations,
      { 
        id: null,
        niveau_id: availableNiveaux[0].id, 
        coefficient: 1, 
        est_obligatoire: true, 
        volume_horaire: 0 
      }
    ]);
  };

  // Mettre à jour une configuration
  const updateConfiguration = (index, field, value) => {
    const newConfigs = [...configurations];
    newConfigs[index][field] = value;
    setConfigurations(newConfigs);
    
    // Effacer l'erreur si elle existe
    if (errors[`config_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`config_${index}`];
      setErrors(newErrors);
    }
  };

  // Supprimer une configuration
  const removeConfiguration = (index) => {
    // Si c'est une configuration existante en base, il faut la supprimer via API
    const config = configurations[index];
    if (config.id) {
      // Marquer pour suppression (sera traité lors de la sauvegarde)
      if (!window.confirm('Supprimer cette configuration ?')) return;
    }
    setConfigurations(configurations.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (formData.nom?.trim()?.length < 2) newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    
    if (configurations.length === 0) {
      newErrors.configurations = 'Au moins une configuration est requise';
    }

    configurations.forEach((config, index) => {
      if (!config.niveau_id) {
        newErrors[`config_${index}`] = 'Niveau requis';
      }
      if (!config.coefficient || config.coefficient <= 0) {
        newErrors[`config_${index}`] = 'Coefficient doit être > 0';
      }
      if (config.coefficient > 20) {
        newErrors[`config_${index}`] = 'Coefficient ne peut pas dépasser 20';
      }
    });

    // Vérifier les doublons de niveau
    const niveauIds = configurations.map(c => c.niveau_id);
    const uniqueNiveauIds = new Set(niveauIds);
    if (niveauIds.length !== uniqueNiveauIds.size) {
      newErrors.configurations = 'Un niveau ne peut être configuré qu\'une seule fois';
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
        nom: formData.nom.trim(),
        code: formData.code?.trim() || '',
        etablissement: formData.etablissement,
        configurations: configurations.map(c => ({
          niveau_id: parseInt(c.niveau_id),
          coefficient: parseFloat(c.coefficient),
          est_obligatoire: c.est_obligatoire,
          volume_horaire: parseInt(c.volume_horaire) || 0
        }))
      };

      if (isEditMode) {
        await axiosInstance.put(`/matieres/${id}/`, payload);
        showNotification('Matière modifiée avec succès', 'success');
      } else {
        await axiosInstance.post('/matieres/', payload);
        showNotification('Matière créée avec succès', 'success');
      }

      setTimeout(() => navigate('/matieres'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response?.status === 400) {
        const details = Object.values(error.response.data).flat().join(' ');
        setErrors({ global: details });
        showNotification('Erreur de validation : ' + details, 'error');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission', 'error');
      } else if (error.response?.status === 409) {
        showNotification('Une matière avec ce nom ou ce code existe déjà', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Récupère le nom d'un niveau à partir de son ID
  const getNiveauNom = (niveauId) => {
    const niveau = niveaux.find(n => n.id === Number(niveauId));
    return niveau ? niveau.nom : 'Niveau inconnu';
  };

  // Récupère les niveaux disponibles
  const getAvailableNiveaux = () => {
    const configuredIds = configurations.map(c => c.niveau_id);
    return niveaux.filter(n => !configuredIds.includes(n.id));
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
          <button onClick={() => navigate('/matieres')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier la matière' : 'Nouvelle matière'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les informations de la matière' : 'Créez une nouvelle matière scolaire'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Nom */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Nom <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 py-3 ${errors.nom ? 'input-error' : ''}`}
                    placeholder="Ex: Mathématiques, Physique, Français..."
                    autoFocus
                  />
                </div>
                {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
              </div>

              {/* Code */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Code</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-10 py-3 uppercase"
                    placeholder="Ex: MATH, PHYS, FR..."
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1">Code abrégé de la matière (optionnel)</span>
              </div>

              {/* Configurations par niveau */}
              <div className="form-control">
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text font-semibold text-gray-700">
                    Configurations par niveau <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm gap-1"
                    onClick={addConfiguration}
                    disabled={getAvailableNiveaux().length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un niveau
                  </button>
                </div>

                {errors.configurations && (
                  <div className="alert alert-error shadow-lg mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors.configurations}</span>
                  </div>
                )}

                {configurations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aucune configuration</p>
                    <p className="text-xs text-gray-400 mt-1">Ajoutez au moins un niveau avec son coefficient</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {configurations.map((config, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 min-w-[150px]">
                          <select
                            className={`select select-bordered w-full ${errors[`config_${index}`] ? 'input-error' : ''}`}
                            value={config.niveau_id}
                            onChange={(e) => updateConfiguration(index, 'niveau_id', parseInt(e.target.value))}
                          >
                            <option value="">Sélectionner un niveau</option>
                            {niveaux.map(n => (
                              <option key={n.id} value={n.id} disabled={configurations.some(c => c.niveau_id === n.id && c.id !== config.id)}>
                                {n.nom} ({n.cycle})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            className={`input input-bordered w-full ${errors[`config_${index}`] ? 'input-error' : ''}`}
                            placeholder="Coef."
                            value={config.coefficient}
                            onChange={(e) => updateConfiguration(index, 'coefficient', parseFloat(e.target.value) || 0)}
                            min="0.5"
                            step="0.5"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            className="input input-bordered w-full"
                            placeholder="Horaire"
                            value={config.volume_horaire}
                            onChange={(e) => updateConfiguration(index, 'volume_horaire', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>

                        <label className="label cursor-pointer gap-2">
                          <span className="label-text text-sm">Oblig.</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={config.est_obligatoire}
                            onChange={(e) => updateConfiguration(index, 'est_obligatoire', e.target.checked)}
                          />
                        </label>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          onClick={() => removeConfiguration(index)}
                          disabled={configurations.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {errors[`config_${index}`] && (
                          <div className="w-full text-error text-xs mt-1">{errors[`config_${index}`]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs text-gray-400">
                    {configurations.length} configuration(s) sur {niveaux.length} niveaux disponibles
                  </span>
                  {getAvailableNiveaux().length > 0 && (
                    <span className="text-xs text-success">
                      {getAvailableNiveaux().length} niveau(x) restant(s)
                    </span>
                  )}
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
            <div className="flex flex-wrap justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/matieres')}
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

        {/* Information supplémentaire pour l'édition */}
        {isEditMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Information</p>
                <p className="text-xs text-blue-600 mt-1">
                  La modification d'une matière peut affecter les notes, les évaluations et les cours associés.
                  Les données existantes seront conservées.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionMatieresForm;