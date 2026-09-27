// src/components/evaluations/TypeEvaluationForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, X, Loader2, Tag, Palette, Hash } from 'lucide-react';

const TypeEvaluationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    coefficient: 1.0,
    est_actif: true,
    couleur: '#7c3aed',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Couleurs prédéfinies
  const presetColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
    '#06b6d4', '#d946ef', '#22c55e', '#eab308', '#a855f7'
  ];

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchType = async () => {
      if (!isEditing) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          setMessage('❌ Session expirée');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };
        const res = await axiosInstance.get(`/types-evaluation/${id}/`, headers);
        const data = res.data || {};
        
        setFormData({
          nom: data.nom || '',
          categorie: data.categorie || '',
          coefficient: data.coefficient || 1.0,
          est_actif: data.est_actif !== false,
          couleur: data.couleur || '#7c3aed',
          description: data.description || ''
        });

      } catch (e) {
        console.error('❌ Erreur chargement:', e);
        if (e.response?.status === 404) {
          setError('Type d\'évaluation non trouvé');
        } else {
          setMessage('❌ Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchType();
  }, [id, isEditing, navigate]);

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage('');

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        setMessage('❌ Session expirée');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      const dataToSend = {
        nom: formData.nom.trim(),
        categorie: formData.categorie.trim() || 'devoir',
        coefficient: parseFloat(formData.coefficient) || 1.0,
        est_actif: formData.est_actif,
        couleur: formData.couleur || null,
        description: formData.description?.trim() || ''
      };

      console.log('📤 Données envoyées:', dataToSend);

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/types-evaluation/${id}/`, dataToSend, headers);
        setMessage('✅ Type d\'évaluation modifié avec succès');
      } else {
        response = await axiosInstance.post('/types-evaluation/', dataToSend, headers);
        setMessage('✅ Type d\'évaluation créé avec succès');
      }

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/types-evaluation/${response.data.id}`);
        } else {
          navigate('/types-evaluation');
        }
      }, 1500);

    } catch (e) {
      console.error('❌ Erreur soumission:', e);
      
      if (e.response?.data) {
        const errors = Object.values(e.response.data).flat().join(', ');
        setError(errors);
        setMessage(`❌ ${errors}`);
      } else if (e.response?.status === 400) {
        setMessage('❌ Données invalides. Vérifiez les champs.');
      } else if (e.response?.status === 403) {
        setMessage('❌ Vous n\'avez pas la permission.');
      } else if (e.response?.status === 401) {
        setMessage('❌ Session expirée.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('❌ Erreur lors de l\'enregistrement');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // GESTIONNAIRES DE CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">
            Chargement du type d'évaluation...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-red-600">{error}</h3>
          </div>
          <button onClick={() => navigate('/types-evaluation')} className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg">
            <ArrowLeft className="w-4 h-4 inline mr-2" /> Retour
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      
      {message && (
        <div className={`max-w-3xl mx-auto mb-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' : 
          'bg-red-100 text-red-800 border border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{message}</span>
            <button className="font-bold" onClick={() => setMessage('')}>✕</button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Modifier le type d\'évaluation' : 'Nouveau type d\'évaluation'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifiez les informations du type' : 'Créez un nouveau type d\'évaluation'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/types-evaluation')} className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du type *
              </label>
              <input
                type="text"
                name="nom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.nom || ''}
                onChange={handleChange}
                placeholder="Ex: Devoir, Examen, TP, Projet..."
                required
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                name="categorie"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.categorie || ''}
                onChange={handleChange}
                placeholder="Ex: devoir, examen, tp, projet, oral..."
              />
              <p className="text-xs text-gray-400 mt-1">Libre : vous pouvez saisir ce que vous voulez</p>
            </div>

            {/* Coefficient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coefficient par défaut
              </label>
              <input
                type="number"
                name="coefficient"
                step="0.5"
                min="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.coefficient || 1.0}
                onChange={handleChange}
              />
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.couleur === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, couleur: color })}
                  />
                ))}
              </div>
              <input
                type="color"
                name="couleur"
                className="w-full h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                value={formData.couleur || '#7c3aed'}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Description du type d'évaluation..."
              />
            </div>

            {/* Actif */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="est_actif"
                id="est_actif"
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                checked={formData.est_actif !== false}
                onChange={handleChange}
              />
              <label htmlFor="est_actif" className="text-sm font-medium text-gray-700">
                Actif
              </label>
            </div>

          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
              onClick={() => navigate('/types-evaluation')}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TypeEvaluationForm;