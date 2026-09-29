// src/components/stock/UniteMesureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Ruler, ArrowLeft, Scale, Droplet, Box,
  CheckCircle, AlertCircle, Trash2, Info
} from 'lucide-react';

// Suggestions prédéfinies par type d'unité
const SUGGESTIONS = {
  weight: [
    { name: 'Milligramme', symbol: 'mg', conversion_factor: 0.001, is_base_unit: false },
    { name: 'Gramme', symbol: 'g', conversion_factor: 1, is_base_unit: true },
    { name: 'Kilogramme', symbol: 'kg', conversion_factor: 1000, is_base_unit: false },
    { name: 'Tonne', symbol: 't', conversion_factor: 1000000, is_base_unit: false },
    { name: 'Livre', symbol: 'lb', conversion_factor: 453.592, is_base_unit: false },
    { name: 'Once', symbol: 'oz', conversion_factor: 28.3495, is_base_unit: false },
  ],
  volume: [
    { name: 'Millilitre', symbol: 'mL', conversion_factor: 0.001, is_base_unit: false },
    { name: 'Centilitre', symbol: 'cL', conversion_factor: 0.01, is_base_unit: false },
    { name: 'Litre', symbol: 'L', conversion_factor: 1, is_base_unit: true },
    { name: 'Mètre cube', symbol: 'm³', conversion_factor: 1000, is_base_unit: false },
    { name: 'Gallon', symbol: 'gal', conversion_factor: 3.78541, is_base_unit: false },
  ],
  length: [
    { name: 'Millimètre', symbol: 'mm', conversion_factor: 0.001, is_base_unit: false },
    { name: 'Centimètre', symbol: 'cm', conversion_factor: 0.01, is_base_unit: false },
    { name: 'Mètre', symbol: 'm', conversion_factor: 1, is_base_unit: true },
    { name: 'Kilomètre', symbol: 'km', conversion_factor: 1000, is_base_unit: false },
    { name: 'Pouce', symbol: 'in', conversion_factor: 0.0254, is_base_unit: false },
    { name: 'Pied', symbol: 'ft', conversion_factor: 0.3048, is_base_unit: false },
  ],
  unit: [
    { name: 'Pièce', symbol: 'pc', conversion_factor: 1, is_base_unit: true },
    { name: 'Paquet', symbol: 'pk', conversion_factor: 1, is_base_unit: false },
    { name: 'Boîte', symbol: 'bx', conversion_factor: 1, is_base_unit: false },
    { name: 'Carton', symbol: 'ctn', conversion_factor: 1, is_base_unit: false },
    { name: 'Douzaine', symbol: 'dz', conversion_factor: 12, is_base_unit: false },
  ],
};

const UniteMesureForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'unit',
    conversion_factor: 1.0000,
    is_base_unit: false,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const loadUniteMesure = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/unit-measures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        name: data.name || '',
        symbol: data.symbol || '',
        type: data.type || 'unit',
        conversion_factor: data.conversion_factor || 1.0000,
        is_base_unit: data.is_base_unit || false,
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Impossible de charger l\'unité', 'error');
      navigate('/unites-mesure');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadUniteMesure();
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

  const applySuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      symbol: suggestion.symbol,
      conversion_factor: suggestion.conversion_factor,
      is_base_unit: suggestion.is_base_unit,
    }));
    setErrors({});
  };

  const applyFieldSuggestion = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.symbol.trim()) newErrors.symbol = 'Le symbole est requis';
    if (formData.conversion_factor <= 0) newErrors.conversion_factor = 'Le facteur de conversion doit être positif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };

      if (isEditMode) {
        await AxiosInstance.patch(`/unit-measures/${id}/`, formData, { headers });
        showNotification('Unité modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/unit-measures/', formData, { headers });
        showNotification('Unité créée avec succès', 'success');
      }

      setTimeout(() => navigate('/unites-mesure'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
        showNotification('Veuillez vérifier les champs', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/unit-measures/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Unité supprimée avec succès', 'success');
      setTimeout(() => navigate('/unites-mesure'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'weight': return <Scale className="w-5 h-5" />;
      case 'volume': return <Droplet className="w-5 h-5" />;
      case 'length': return <Ruler className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (formData.type) {
      case 'weight': return 'Poids';
      case 'volume': return 'Volume';
      case 'length': return 'Longueur';
      default: return 'Unité';
    }
  };

  const currentSuggestions = SUGGESTIONS[formData.type] || [];
  const symbolSuggestions = currentSuggestions.map(s => s.symbol);

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg rounded-lg`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
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

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmer la suppression
                </h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">
                Voulez-vous vraiment supprimer cette unité ?
              </p>
              <p className="font-medium text-gray-900 mt-2">{formData.name}</p>
              {formData.is_base_unit && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Cette unité est marquée comme unité de base.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50 border-t">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteneur pleine largeur */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/unites-mesure')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Modifier l\'unité' : 'Nouvelle unité de mesure'}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-11">
                {isEditMode
                  ? 'Modifiez les informations de l\'unité'
                  : 'Créez une nouvelle unité de mesure'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline btn-error btn-sm gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>

        {/* Layout 2 colonnes : formulaire à gauche, suggestions à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Colonne Formulaire (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-5">
                  {/* Aperçu du type */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getTypeIcon()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Type d'unité
                      </p>
                      <p className="text-base font-medium text-gray-900 mt-0.5">
                        {getTypeLabel()}
                      </p>
                    </div>
                  </div>

                  {/* Ligne 1 : Type + Nom + Symbole */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">Type</span>
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                      >
                        <option value="unit">Unité</option>
                        <option value="weight">Poids</option>
                        <option value="volume">Volume</option>
                        <option value="length">Longueur</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Nom <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                        placeholder="Ex: Kilogramme"
                      />
                      {errors.name && (
                        <span className="text-red-500 text-xs mt-1">{errors.name}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Symbole <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.symbol ? 'input-error' : ''}`}
                        placeholder="Ex: kg"
                      />
                      {errors.symbol && (
                        <span className="text-red-500 text-xs mt-1">{errors.symbol}</span>
                      )}
                    </div>
                  </div>

                  {/* Ligne 2 : Facteur + Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Facteur de conversion
                        </span>
                      </label>
                      <input
                        type="number"
                        name="conversion_factor"
                        value={formData.conversion_factor}
                        onChange={handleChange}
                        step="0.0001"
                        className={`input input-bordered w-full ${errors.conversion_factor ? 'input-error' : ''}`}
                        placeholder="1.0000"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Facteur de conversion vers l'unité de base
                      </p>
                      {errors.conversion_factor && (
                        <span className="text-red-500 text-xs mt-1">{errors.conversion_factor}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">Options</span>
                      </label>
                      <div className="space-y-1 border border-gray-200 rounded-lg p-2">
                        <label className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_base_unit"
                            checked={formData.is_base_unit}
                            onChange={handleChange}
                            className="checkbox checkbox-primary checkbox-sm mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 block">
                              Unité de base
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Les conversions se feront par rapport à cette unité
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="checkbox checkbox-primary checkbox-sm mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 block">
                              Active
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Les unités inactives ne seront pas disponibles
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Information sur les conversions */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Le facteur de conversion permet de convertir cette unité vers l'unité de base.
                        Par exemple, si l'unité de base est le gramme et cette unité est le kilogramme,
                        le facteur de conversion sera 1000.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/unites-mesure')}
                    className="btn btn-ghost gap-2"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary gap-2 min-w-[130px]"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditMode ? 'Enregistrer' : 'Créer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Colonne Suggestions (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-20">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">
                    Suggestions
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cliquez pour remplir automatiquement
                </p>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                {currentSuggestions.length > 0 ? (
                  <>
                    {/* Suggestions complètes */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {getTypeLabel()}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {currentSuggestions.map((suggestion, index) => {
                          const isSelected =
                            formData.name === suggestion.name &&
                            formData.symbol === suggestion.symbol;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                                isSelected
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5'
                              }`}
                            >
                              <span className="font-medium truncate">
                                {suggestion.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {suggestion.symbol}
                                </span>
                                {suggestion.is_base_unit && (
                                  <span
                                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-blue-50 text-blue-600'
                                    }`}
                                  >
                                    Base
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Symboles rapides */}
                    {symbolSuggestions.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Symboles rapides
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {symbolSuggestions.map((symbol, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => applyFieldSuggestion('symbol', symbol)}
                              className={`px-2 py-1 rounded border text-xs font-mono transition-colors ${
                                formData.symbol === symbol
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                              }`}
                            >
                              {symbol}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Aucune suggestion pour ce type
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniteMesureForm;