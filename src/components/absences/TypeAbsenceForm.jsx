// src/components/absences/TypeAbsenceForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Tag,
  FileText,
  RefreshCw,
  Check,
  UserX,
  Palette,
  Filter
} from 'lucide-react';

const TypeAbsenceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    est_justifie: false,
    couleur: '#4F46E5',
    description: '',
    est_actif: true
  });

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Si édition, charger le type d'absence
        if (id) {
          const res = await axiosInstance.get(`/types-absence/${id}/`, headers);
          const data = res.data;
          setFormData({
            nom: data.nom || '',
            code: data.code || '',
            est_justifie: data.est_justifie || false,
            couleur: data.couleur || '#4F46E5',
            description: data.description || '',
            est_actif: data.est_actif !== undefined ? data.est_actif : true
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      showMessage('Veuillez saisir un nom', 'error');
      return;
    }

    if (!formData.code.trim()) {
      showMessage('Veuillez saisir un code', 'error');
      return;
    }

    if (formData.code.length > 10) {
      showMessage('Le code ne doit pas dépasser 10 caractères', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const dataToSend = {
        ...formData,
        nom: formData.nom.trim(),
        code: formData.code.trim().toUpperCase()
      };

      if (isEditing) {
        await axiosInstance.put(`/types-absence/${id}/`, dataToSend, headers);
        showMessage('Type d\'absence modifié avec succès', 'success');
      } else {
        await axiosInstance.post('/types-absence/', dataToSend, headers);
        showMessage('Type d\'absence créé avec succès', 'success');
      }

      setTimeout(() => navigate('/types-absence'), 1500);

    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        showMessage(errors.join(' ') || 'Erreur lors de l\'enregistrement', 'error');
      } else {
        showMessage('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">Erreur</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Message de notification */}
      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/types-absence')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Tag className="h-6 w-6 text-blue-600" />
                {isEditing ? 'Modifier un type d\'absence' : 'Nouveau type d\'absence'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="h-4 w-4 inline mr-1" />
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Maladie, Congé, Formation..."
                required
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Ex: MAL, CON, FOR..."
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Code unique (max 10 caractères)</p>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Palette className="h-4 w-4 inline mr-1" />
                Couleur
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  name="couleur"
                  value={formData.couleur}
                  onChange={handleChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="couleur"
                  value={formData.couleur}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="#4F46E5"
                />
              </div>
            </div>

            {/* Justifié */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Justification
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="est_justifie"
                  checked={formData.est_justifie}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Ce type d'absence est justifié
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Si coché, l'absence sera considérée comme justifiée
              </p>
            </div>

            {/* Actif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Check className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="est_actif"
                  checked={formData.est_actif}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Actif</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Description du type d'absence..."
              />
            </div>

            {/* Aperçu */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Aperçu</h3>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: formData.couleur || '#4F46E5' }}
                >
                  {formData.code.substring(0, 2) || 'T'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{formData.nom || 'Nom du type'}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-gray-500">{formData.code || 'CODE'}</span>
                    <span className="text-gray-300">|</span>
                    <span className={formData.est_justifie ? 'text-green-600' : 'text-red-600'}>
                      {formData.est_justifie ? '✓ Justifié' : '✗ Non justifié'}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className={formData.est_actif ? 'text-green-600' : 'text-gray-400'}>
                      {formData.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/types-absence')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Modifier' : 'Enregistrer'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TypeAbsenceForm;