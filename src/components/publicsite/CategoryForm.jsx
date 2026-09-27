// src/components/publicsite/CategoryForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, X, Loader2, Tag } from 'lucide-react';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    couleur: '#3b82f6',
    est_active: true,
    ordre: 0
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
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    const fetchCategory = async () => {
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
        const res = await axiosInstance.get(`/categories/${id}/`, headers);
        const data = res.data || {};
        
        setFormData({
          nom: data.nom || '',
          description: data.description || '',
          couleur: data.couleur || '#3b82f6',
          est_active: data.est_active !== false,
          ordre: data.ordre || 0
        });

      } catch (e) {
        console.error('❌ Erreur:', e);
        if (e.response?.status === 404) {
          setError('Catégorie non trouvée');
        } else {
          setMessage('❌ Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, isEditing, navigate]);

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
        description: formData.description?.trim() || '',
        couleur: formData.couleur || '#3b82f6',
        est_active: formData.est_active,
        ordre: parseInt(formData.ordre) || 0
      };

      console.log('📤 Données envoyées:', dataToSend);

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/categories/${id}/`, dataToSend, headers);
        setMessage('✅ Catégorie modifiée avec succès');
      } else {
        response = await axiosInstance.post('/categories/', dataToSend, headers);
        setMessage('✅ Catégorie créée avec succès');
      }

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/categories/${response.data.id}`);
        } else {
          navigate('/categories');
        }
      }, 1500);

    } catch (e) {
      console.error('❌ Erreur soumission:', e);
      if (e.response?.data) {
        const errors = Object.values(e.response.data).flat().join(', ');
        setMessage(`❌ ${errors}`);
      } else {
        setMessage('❌ Erreur lors de l\'enregistrement');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // GESTIONNAIRES
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <div className="text-center">
          <Tag className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error}</h3>
          <button onClick={() => navigate('/categories')} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">
            Retour
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
      
      {/* MESSAGE */}
      {message && (
        <div className={`w-full px-4 py-2.5 text-sm ${
          message.includes('✅') ? 'bg-green-100 text-green-800 border-b border-green-300' : 
          'bg-red-100 text-red-800 border-b border-red-300'
        }`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <span>{message}</span>
            <button className="font-bold" onClick={() => setMessage('')}>✕</button>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/categories')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h1>
              <p className="text-xs text-gray-500">
                {isEditing ? 'Modifiez les informations' : 'Créez une nouvelle catégorie'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE */}
      <div className="w-full px-4 py-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  name="nom"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nom || ''}
                  onChange={handleChange}
                  placeholder="Ex: Actualités, Pédagogie, Événements..."
                  required
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Description de la catégorie..."
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
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="couleur"
                    className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer"
                    value={formData.couleur || '#3b82f6'}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="couleur"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    value={formData.couleur || '#3b82f6'}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Ordre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  name="ordre"
                  min="0"
                  className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.ordre || 0}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-400 mt-1">Les catégories sont affichées par ordre croissant</p>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="est_active"
                  id="est_active"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={formData.est_active !== false}
                  onChange={handleChange}
                />
                <label htmlFor="est_active" className="text-sm font-medium text-gray-700">
                  Catégorie active
                </label>
              </div>

            </div>

            {/* BOUTONS */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
                onClick={() => navigate('/categories')}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 flex-1 justify-center disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;