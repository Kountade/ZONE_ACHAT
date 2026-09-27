// src/components/publicsite/ArticleForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, FileText,
  AlertCircle, Upload, CheckCircle
} from 'lucide-react';

const ArticleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    titre: '',
    extrait: '',
    contenu: '',
    categorie: '',
    image_alt: '',
    statut: 'brouillon',
    date_publication: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [categories, setCategories] = useState([]);
  
  // État pour l'image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDeleted, setImageDeleted] = useState(false);
  const [existingImage, setExistingImage] = useState(null);

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          showMessage('❌ Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Charger les catégories
        const catRes = await axiosInstance.get('/categories/', headers);
        let catData = [];
        if (Array.isArray(catRes.data)) {
          catData = catRes.data;
        } else if (catRes.data?.results) {
          catData = catRes.data.results;
        }
        setCategories(catData);

        // Si édition, charger l'article
        if (isEditing) {
          const res = await axiosInstance.get(`/articles/${id}/`, headers);
          const data = res.data || {};
          
          // Formater la date pour l'input datetime-local
          let datePublication = '';
          if (data.date_publication) {
            const dateObj = new Date(data.date_publication);
            if (!isNaN(dateObj.getTime())) {
              datePublication = dateObj.toISOString().slice(0, 16);
            }
          }

          setFormData({
            titre: data.titre || '',
            extrait: data.extrait || '',
            contenu: data.contenu || '',
            categorie: data.categorie || '',
            image_alt: data.image_alt || '',
            statut: data.statut || 'brouillon',
            date_publication: datePublication,
          });
          
          // Si l'article a une image existante
          if (data.image) {
            const imageUrl = `${axiosInstance.defaults.baseURL}${data.image}`;
            setExistingImage(imageUrl);
            setImagePreview(imageUrl);
          }
        }

      } catch (e) {
        console.error('❌ Erreur:', e);
        if (e.response?.status === 404) {
          setError('Article non trouvé');
        } else if (e.response?.status === 401) {
          showMessage('❌ Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          showMessage('❌ Erreur de chargement', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, navigate]);

  // ============================================================
  // GESTION DE L'IMAGE
  // ============================================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log('📁 Fichier sélectionné:', file);
    
    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('❌ Le fichier est trop volumineux (max 5 Mo)', 'error');
      e.target.value = '';
      return;
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('❌ Format non supporté. Utilisez JPG, PNG, GIF ou WebP.', 'error');
      e.target.value = '';
      return;
    }

    console.log('✅ Fichier valide:', file.name, file.size, file.type);
    
    // Mettre à jour les états
    setImageFile(file);
    setImageDeleted(false);
    setExistingImage(null);
    
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageDeleted(true);
    setImagePreview(null);
    setExistingImage(null);
    
    // Réinitialiser l'input file
    const input = document.getElementById('image-upload');
    if (input) input.value = '';
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showMessage('❌ Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Créer FormData
      const formDataToSend = new FormData();
      
      // ✅ Ajouter les champs texte
      formDataToSend.append('titre', formData.titre.trim());
      formDataToSend.append('extrait', formData.extrait?.trim() || '');
      formDataToSend.append('contenu', formData.contenu?.trim() || '');
      
      if (formData.categorie) {
        formDataToSend.append('categorie', formData.categorie);
      }
      
      formDataToSend.append('statut', formData.statut || 'brouillon');
      
      if (formData.image_alt) {
        formDataToSend.append('image_alt', formData.image_alt.trim());
      }
      
      if (formData.date_publication) {
        const dateObj = new Date(formData.date_publication);
        if (!isNaN(dateObj.getTime())) {
          formDataToSend.append('date_publication', dateObj.toISOString());
        }
      }

      // ✅ Gérer l'image
      console.log('🔍 Gestion de l\'image:');
      console.log('  - imageFile:', imageFile);
      console.log('  - imageDeleted:', imageDeleted);
      console.log('  - existingImage:', existingImage);
      
      if (imageFile && imageFile instanceof File) {
        // Nouvelle image à uploader
        console.log('✅ Upload nouvelle image:', imageFile.name, imageFile.size);
        formDataToSend.append('image', imageFile);
      } else if (imageDeleted && isEditing) {
        // Supprimer l'image existante
        console.log('🗑️ Suppression de l\'image');
        formDataToSend.append('image_clear', 'true');
      }
      // Si aucune modification, ne pas envoyer le champ image

      // ✅ DEBUG - Afficher le contenu de FormData
      console.log('📤 FormData envoyé:');
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type})`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      // ✅ Configuration pour axios avec FormData
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        // Important pour que axios ne modifie pas FormData
        transformRequest: [(data) => data],
      };

      let response;

      if (isEditing) {
        console.log(`📤 Mise à jour de l'article ${id}...`);
        response = await axiosInstance.put(
          `/articles/${id}/`,
          formDataToSend,
          config
        );
        showMessage('✅ Article modifié avec succès', 'success');
      } else {
        console.log('📤 Création de l\'article...');
        response = await axiosInstance.post(
          '/articles/',
          formDataToSend,
          config
        );
        showMessage('✅ Article créé avec succès', 'success');
      }

      console.log('✅ Réponse:', response.data);

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/articles/${response.data.id}`);
        } else {
          navigate('/articles');
        }
      }, 1500);

    } catch (e) {
      console.error('❌ Erreur détaillée:', e);
      console.error('❌ Response:', e.response);
      console.error('❌ Data:', e.response?.data);
      
      // Gestion des erreurs
      if (e.response?.status === 400) {
        const errors = Object.values(e.response.data).flat().join(', ');
        showMessage(`❌ ${errors}`, 'error');
      } else if (e.response?.status === 401) {
        showMessage('❌ Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (e.response?.status === 404) {
        showMessage('❌ Article non trouvé', 'error');
      } else {
        showMessage('❌ Erreur lors de l\'enregistrement', 'error');
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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error}</h3>
          <button onClick={() => navigate('/articles')} className="mt-3 btn btn-primary">
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
    <div className="max-w-6xl mx-auto p-6">
      
      {/* Notification flottante */}
      {message && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`alert shadow-lg border-l-4 ${
            messageType === 'error' 
              ? 'alert-error border-l-error' 
              : 'alert-success border-l-success'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={() => setMessage('')} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8">
        
        {/* EN-TÊTE */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/articles')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-base-content">
            {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>
        </div>

        {/* ✅ FORMULAIRE AVEC encType */}
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLONNE GAUCHE - Contenu principal */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Titre */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Titre de l'article *</span>
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Titre de l'article"
                  required
                />
              </div>

              {/* Extrait */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Extrait / Résumé *</span>
                </label>
                <textarea
                  name="extrait"
                  rows="3"
                  value={formData.extrait || ''}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Résumé de l'article (500 caractères max)"
                  maxLength="500"
                  required
                />
                <p className="text-xs text-base-content/50 mt-1">
                  {formData.extrait?.length || 0}/500 caractères
                </p>
              </div>

              {/* Contenu */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Contenu *</span>
                </label>
                <textarea
                  name="contenu"
                  rows="12"
                  value={formData.contenu || ''}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full font-mono"
                  placeholder="Contenu complet de l'article (HTML ou Markdown)"
                  required
                />
              </div>
            </div>

            {/* COLONNE DROITE - Métadonnées */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Catégorie */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Catégorie</span>
                </label>
                <select
                  name="categorie"
                  value={formData.categorie || ''}
                  onChange={handleSelectChange}
                  className="select select-bordered w-full"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Statut</span>
                </label>
                <select
                  name="statut"
                  value={formData.statut || 'brouillon'}
                  onChange={handleSelectChange}
                  className="select select-bordered w-full"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>

              {/* Date de publication */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Date de publication</span>
                </label>
                <input
                  type="datetime-local"
                  name="date_publication"
                  value={formData.date_publication || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Image - Upload */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Image de couverture</span>
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-base-300 flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Aperçu" 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        type="button" 
                        onClick={removeImage} 
                        className="absolute top-1 right-1 bg-error text-white rounded-full p-1 hover:bg-error/80 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-base-300 flex items-center justify-center text-base-content/40">
                      <Upload className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-[200px]">
                    <input 
                      id="image-upload" 
                      type="file" 
                      name="image"
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="file-input file-input-bordered w-full" 
                    />
                    <p className="text-xs text-base-content/50 mt-1">
                      PNG, JPG, GIF, WebP (max 5MB)
                    </p>
                    <input
                      type="text"
                      name="image_alt"
                      value={formData.image_alt || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full mt-2"
                      placeholder="Texte alternatif (SEO)"
                    />
                  </div>
                </div>
              </div>

              {/* BOUTONS */}
              <div className="flex gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => navigate('/articles')}
                  className="btn btn-ghost flex-1"
                >
                  <X className="w-4 h-4" /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1 gap-2"
                >
                  {submitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;