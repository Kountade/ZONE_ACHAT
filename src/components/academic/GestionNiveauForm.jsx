// src/components/gestion/GestionNiveauForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, Layers, RefreshCw, ArrowLeft,
  CheckCircle, AlertCircle, Trash2, Calendar,
  Tag, BookOpen, Home, Award
} from 'lucide-react';

const GestionNiveauForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nom: '',
    cycle: 'college',
    ordre: 1,
    annee_scolaire: '',
  });
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Charger les années scolaires
  const loadAnnees = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/');
      setAnnees(response.data || []);
    } catch (error) {
      console.error('Erreur chargement années:', error);
      showNotification('Impossible de charger les années scolaires', 'error');
    }
  };

  // Charger un niveau existant
  const loadNiveau = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/niveaux/${id}/`);
      const niveau = response.data;
      setFormData({
        nom: niveau.nom || '',
        cycle: niveau.cycle || 'college',
        ordre: niveau.ordre || 1,
        annee_scolaire: niveau.annee_scolaire || '',
      });
    } catch (error) {
      console.error('Erreur chargement niveau:', error);
      if (error.response?.status === 404) {
        showNotification('Niveau non trouvé', 'error');
        navigate('/niveaux');
      } else {
        showNotification('Impossible de charger le niveau', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadAnnees();
      await loadNiveau();
    };
    init();
  }, [id]);

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

  const validate = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.cycle) newErrors.cycle = 'Le cycle est requis';
    if (formData.ordre < 1) newErrors.ordre = 'L\'ordre doit être supérieur à 0';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
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
        cycle: formData.cycle,
        ordre: parseInt(formData.ordre) || 1,
        annee_scolaire: formData.annee_scolaire,
      };

      if (isEditMode) {
        await axiosInstance.put(`/niveaux/${id}/`, payload);
        showNotification('Niveau modifié avec succès', 'success');
      } else {
        await axiosInstance.post('/niveaux/', payload);
        showNotification('Niveau créé avec succès', 'success');
      }

      setTimeout(() => navigate('/niveaux'), 1500);
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
          <button onClick={() => navigate('/niveaux')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier le niveau' : 'Nouveau niveau'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les informations du niveau' : 'Créez un nouveau niveau scolaire'}
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
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 py-3 ${errors.nom ? 'input-error' : ''}`}
                    placeholder="Ex: 6ème, Seconde, Licence 1..."
                    autoFocus
                  />
                </div>
                {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
              </div>

              {/* Cycle */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Cycle <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="cycle"
                    value={formData.cycle}
                    onChange={handleChange}
                    className={`select select-bordered w-full pl-10 ${errors.cycle ? 'input-error' : ''}`}
                  >
                    <option value="primaire">Primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="sup">Supérieur</option>
                  </select>
                </div>
                {errors.cycle && <span className="text-error text-xs mt-1">{errors.cycle}</span>}
              </div>

              {/* Ordre */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Ordre <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="ordre"
                    value={formData.ordre}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 ${errors.ordre ? 'input-error' : ''}`}
                    placeholder="1, 2, 3..."
                    min="1"
                  />
                </div>
                {errors.ordre && <span className="text-error text-xs mt-1">{errors.ordre}</span>}
                <span className="text-xs text-gray-400 mt-1">Ordre chronologique (1 = premier niveau)</span>
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
                onClick={() => navigate('/niveaux')}
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
                  La modification d'un niveau peut affecter l'organisation des classes et des cours.
                  Les classes associées seront conservées.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionNiveauForm;