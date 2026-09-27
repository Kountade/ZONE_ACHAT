// src/components/gestion/GestionSallesForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, DoorOpen, ArrowLeft, Users,
  CheckCircle, AlertCircle, Trash2,
  BookOpen, Building2, Home, Tag, RefreshCw
} from 'lucide-react';

const GestionSallesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nom: '',
    capacite: 30,
    type_salle: 'cours',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [etablissementId, setEtablissementId] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  const TYPE_SALLE_CHOICES = [
    { value: 'cours', label: 'Cours', icon: BookOpen },
    { value: 'tp', label: 'Travaux Pratiques', icon: Building2 },
    { value: 'amphi', label: 'Amphithéâtre', icon: Home },
    { value: 'sport', label: 'Sport', icon: Tag },
  ];

  // Récupérer l'établissement de l'utilisateur
  const getEtablissement = () => {
    try {
      const userData = localStorage.getItem('User');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.etablissement) {
          setEtablissementId(user.etablissement);
          return user.etablissement;
        }
      }
      // Si pas d'établissement dans l'utilisateur, essayer de récupérer via API
      fetchEtablissement();
    } catch (error) {
      console.error('Erreur récupération établissement:', error);
    }
    return null;
  };

  const fetchEtablissement = async () => {
    try {
      const response = await axiosInstance.get('/etablissements/unique/');
      if (response.data && response.data.id) {
        setEtablissementId(response.data.id);
      }
    } catch (error) {
      console.error('Erreur chargement établissement:', error);
      showNotification('Impossible de récupérer l\'établissement', 'error');
    }
  };

  // Charger une salle existante
  const loadSalle = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/salles/${id}/`);
      const salle = response.data;
      setFormData({
        nom: salle.nom || '',
        capacite: salle.capacite || 30,
        type_salle: salle.type_salle || 'cours',
      });
      // Récupérer l'établissement si présent
      if (salle.etablissement) {
        setEtablissementId(salle.etablissement);
      } else {
        getEtablissement();
      }
    } catch (error) {
      console.error('Erreur chargement salle:', error);
      let errorMsg = 'Impossible de charger la salle';
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMsg = 'Le serveur ne répond pas. Vérifiez qu\'il est démarré sur http://127.0.0.1:8000/';
      } else if (error.response?.status === 404) {
        errorMsg = 'Salle non trouvée';
        setTimeout(() => navigate('/salles'), 2000);
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expirée, veuillez vous reconnecter';
        setTimeout(() => navigate('/login'), 2000);
      }
      showNotification(errorMsg, 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Récupérer l'établissement au chargement
    getEtablissement();
    loadSalle();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacite' ? parseInt(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.capacite || formData.capacite < 1) {
      newErrors.capacite = 'La capacité doit être supérieure à 0';
    }
    if (formData.capacite > 500) {
      newErrors.capacite = 'La capacité ne peut pas dépasser 500';
    }
    if (!formData.type_salle) newErrors.type_salle = 'Le type est requis';
    if (!etablissementId) {
      newErrors.etablissement = 'Établissement non trouvé. Veuillez vous reconnecter.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du formulaire
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    // Vérification de la connexion au serveur
    if (!navigator.onLine) {
      showNotification('Pas de connexion internet. Vérifiez votre réseau.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nom: formData.nom.trim(),
        capacite: parseInt(formData.capacite) || 30,
        type_salle: formData.type_salle,
        etablissement: etablissementId, // Ajout de l'établissement
      };

      console.log('Envoi des données:', payload);
      console.log('URL:', isEditMode ? `/salles/${id}/` : '/salles/');

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/salles/${id}/`, payload);
      } else {
        response = await axiosInstance.post('/salles/', payload);
      }

      console.log('Réponse:', response.data);
      
      showNotification(
        isEditMode ? 'Salle modifiée avec succès' : 'Salle créée avec succès',
        'success'
      );

      setTimeout(() => navigate('/salles'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      
      let errorMsg = 'Une erreur est survenue';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMsg = 'Le serveur ne répond pas. Vérifiez qu\'il est démarré sur http://127.0.0.1:8000/';
      } else if (error.response?.status === 400) {
        const data = error.response.data;
        if (typeof data === 'object') {
          // Vérifier si le champ etablissement est manquant
          if (data.etablissement) {
            errorMsg = 'Établissement requis. Veuillez vous reconnecter.';
          } else {
            const messages = Object.values(data).flat().join(' ');
            errorMsg = messages || 'Données invalides';
          }
        } else {
          errorMsg = data || 'Données invalides';
        }
      } else if (error.response?.status === 403) {
        errorMsg = 'Vous n\'avez pas la permission';
      } else if (error.response?.status === 409) {
        errorMsg = 'Une salle avec ce nom existe déjà';
      } else if (error.response?.status === 404) {
        errorMsg = 'Ressource non trouvée';
      } else if (error.response?.status === 500) {
        errorMsg = 'Erreur interne du serveur';
      }
      
      setErrors({ global: errorMsg });
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette salle ? Cette action est irréversible.')) return;
    
    setLoading(true);
    try {
      await axiosInstance.delete(`/salles/${id}/`);
      showNotification('Salle supprimée avec succès', 'success');
      setTimeout(() => navigate('/salles'), 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      let errorMsg = 'Erreur lors de la suppression';
      if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Le serveur ne répond pas. Vérifiez la connexion.';
      } else if (error.response?.status === 403) {
        errorMsg = 'Vous n\'avez pas la permission';
      }
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Réessayer la connexion
  const handleRetry = () => {
    window.location.reload();
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] w-full">
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2 flex-1">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/salles')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <DoorOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier la salle' : 'Nouvelle salle'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les informations de la salle' : 'Créez une nouvelle salle'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Erreur de connexion */}
              {errors.global && errors.global.includes('serveur ne répond pas') && (
                <div className="alert alert-error shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <div className="flex-1">
                    <span className="font-semibold">{errors.global}</span>
                    <p className="text-sm opacity-80 mt-1">
                      Assurez-vous que le serveur Django est démarré avec : <br />
                      <code className="bg-black/10 px-2 py-1 rounded text-xs">python manage.py runserver</code>
                    </p>
                  </div>
                  <button onClick={handleRetry} className="btn btn-sm btn-ghost gap-2">
                    <RefreshCw className="w-4 h-4" /> Réessayer
                  </button>
                </div>
              )}

              {/* Erreur établissement */}
              {errors.etablissement && (
                <div className="alert alert-warning shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.etablissement}</span>
                </div>
              )}

              {/* Autres erreurs globales */}
              {errors.global && !errors.global.includes('serveur ne répond pas') && (
                <div className="alert alert-error shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.global}</span>
                </div>
              )}

              {/* Nom */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Nom de la salle <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 py-3 ${errors.nom ? 'input-error' : ''}`}
                    placeholder="Ex: Salle 101, Amphithéâtre A, Gymnase..."
                    autoFocus
                    disabled={loading}
                  />
                </div>
                {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
              </div>

              {/* Type */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Type de salle <span className="text-error">*</span>
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TYPE_SALLE_CHOICES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type_salle === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type_salle: type.value }))}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                        disabled={loading}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.type_salle && <span className="text-error text-xs mt-1">{errors.type_salle}</span>}
              </div>

              {/* Capacité */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">
                    Capacité <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="capacite"
                    value={formData.capacite}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-10 py-3 ${errors.capacite ? 'input-error' : ''}`}
                    placeholder="30"
                    min="1"
                    max="500"
                    disabled={loading}
                  />
                </div>
                {errors.capacite && <span className="text-error text-xs mt-1">{errors.capacite}</span>}
                <span className="text-xs text-gray-400 mt-1">Nombre de places dans la salle (entre 1 et 500)</span>
              </div>

              {/* Informations supplémentaires */}
              <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-600 mb-1">Informations :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Les champs marqués d'un <span className="text-error">*</span> sont obligatoires</li>
                  <li>La salle sera associée à votre établissement automatiquement</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-error gap-2 w-full sm:w-auto"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/salles')}
                  className="btn btn-ghost gap-2 w-full sm:w-auto"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary gap-2 w-full sm:w-auto min-w-[120px]"
                  disabled={loading || !etablissementId}
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
            </div>
          </form>
        </div>

        {/* Information supplémentaire */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 w-full">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Information</p>
              <p className="text-xs text-blue-600 mt-1">
                Les salles sont utilisées pour l'organisation des cours et des emplois du temps.
                Assurez-vous que la capacité correspond au nombre d'élèves maximum.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionSallesForm;