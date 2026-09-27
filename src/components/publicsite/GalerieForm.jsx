// src/components/admin/GalerieForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Image as ImageIcon,
  AlertCircle, Upload, CheckCircle, Trash2
} from 'lucide-react';

const GalerieForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: '',
    image_alt: '',
    ordre: 0,
    est_actif: true
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [categories, setCategories] = useState([]);
  
  // État pour l'image - IDENTIQUE À ArticleForm
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
        setCategories(catData.map(c => c.nom));

        // Si édition, charger l'image
        if (isEditing) {
          const res = await axiosInstance.get(`/galerie/${id}/`, headers);
          const data = res.data || {};
          
          setFormData({
            titre: data.titre || '',
            description: data.description || '',
            categorie: data.categorie || '',
            image_alt: data.image_alt || '',
            ordre: data.ordre || 0,
            est_actif: data.est_actif !== undefined ? data.est_actif : true
          });
          
          // ✅ CORRECTION : Utiliser l'URL de l'image existante
          if (data.image) {
            const imageUrl = `${axiosInstance.defaults.baseURL}${data.image}`;
            setExistingImage(imageUrl);
            setImagePreview(imageUrl);
          }
        }

      } catch (e) {
        console.error('❌ Erreur:', e);
        if (e.response?.status === 404) {
          setError('Image non trouvée');
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
  // GESTION DE L'IMAGE - IDENTIQUE À ArticleForm
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('❌ Format non supporté. Utilisez JPG, PNG, GIF, SVG ou WebP.', 'error');
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
  // SOUMISSION - IDENTIQUE À ArticleForm
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
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('categorie', formData.categorie?.trim() || '');
      formDataToSend.append('ordre', String(parseInt(formData.ordre, 10) || 0));
      formDataToSend.append('est_actif', formData.est_actif ? 'true' : 'false');
      
      if (formData.image_alt) {
        formDataToSend.append('image_alt', formData.image_alt.trim());
      }

      // ✅ Gérer l'image
      console.log('🔍 Gestion de l\'image:');
      console.log('  - imageFile:', imageFile);
      console.log('  - imageDeleted:', imageDeleted);
      console.log('  - existingImage:', existingImage);
      console.log('  - isEditing:', isEditing);
      
      // ✅ Règle 1: Si nouveau fichier, l'uploader
      if (imageFile && imageFile instanceof File) {
        console.log('✅ Upload nouvelle image:', imageFile.name, imageFile.size);
        formDataToSend.append('image', imageFile);
      } 
      // ✅ Règle 2: Si on est en édition et qu'on veut supprimer l'image existante
      else if (imageDeleted && isEditing) {
        console.log('🗑️ Suppression de l\'image existante');
        formDataToSend.append('image_clear', 'true');
      }
      // ✅ Règle 3: Si on est en création et qu'il n'y a pas d'image -> Erreur
      else if (!isEditing && !imageFile) {
        showMessage('❌ Veuillez sélectionner une image', 'error');
        setSubmitting(false);
        return;
      }

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
        console.log(`📤 Mise à jour de l'image ${id}...`);
        response = await axiosInstance.put(
          `/galerie/${id}/`,
          formDataToSend,
          config
        );
        showMessage('✅ Image modifiée avec succès', 'success');
      } else {
        console.log('📤 Création de l\'image...');
        response = await axiosInstance.post(
          '/galerie/',
          formDataToSend,
          config
        );
        showMessage('✅ Image ajoutée avec succès', 'success');
      }

      console.log('✅ Réponse:', response.data);

      setTimeout(() => {
        navigate('/galerie');
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
        showMessage('❌ Image non trouvée', 'error');
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
          <button onClick={() => navigate('/galerie')} className="mt-3 btn btn-primary">
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
          <button onClick={() => navigate('/galerie')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <ImageIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-base-content">
            {isEditing ? 'Modifier l\'image' : 'Ajouter une image'}
          </h1>
        </div>

        {/* ✅ FORMULAIRE AVEC encType */}
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLONNE GAUCHE - Informations */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Titre */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Titre *</span>
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Titre de l'image"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Description de l'image"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Catégorie</span>
                </label>
                <input
                  type="text"
                  name="categorie"
                  value={formData.categorie || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Événements, Vie scolaire..."
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* COLONNE DROITE - Métadonnées et Image */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Ordre */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Ordre d'affichage</span>
                </label>
                <input
                  type="number"
                  name="ordre"
                  min="0"
                  value={formData.ordre || 0}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Texte alternatif */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Texte alternatif (SEO)</span>
                </label>
                <input
                  type="text"
                  name="image_alt"
                  value={formData.image_alt || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Description pour l'accessibilité"
                />
              </div>

              {/* Est actif */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="est_actif"
                    checked={formData.est_actif !== undefined ? formData.est_actif : true}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-medium">Image active</span>
                </label>
              </div>

              {/* ✅ IMAGE - IDENTIQUE À ArticleForm */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Image {!isEditing && '*'}</span>
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
                      required={!isEditing}
                    />
                    <p className="text-xs text-base-content/50 mt-1">
                      PNG, JPG, GIF, SVG, WebP (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* BOUTONS */}
              <div className="flex gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => navigate('/galerie')}
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
                  {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalerieForm;