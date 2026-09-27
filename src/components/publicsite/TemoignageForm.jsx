// src/components/publicsite/TemoignageForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Quote,
  AlertCircle, Upload, CheckCircle, Star, Users, Loader2
} from 'lucide-react';

const TemoignageForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    role: '',
    contenu: '',
    note: 5,
    est_publie: true,
    est_en_une: false,
    ordre: 0,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
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

        // Si édition, charger le témoignage
        if (isEditing) {
          const res = await axiosInstance.get(`/temoignages/${id}/`, headers);
          const data = res.data || {};
          
          setFormData({
            nom: data.nom || '',
            role: data.role || '',
            contenu: data.contenu || '',
            note: data.note || 5,
            est_publie: data.est_publie !== undefined ? data.est_publie : true,
            est_en_une: data.est_en_une || false,
            ordre: data.ordre || 0,
          });
          
          // ✅ Si le témoignage a une image existante
          if (data.image) {
            // Construire l'URL complète de l'image
            const imageUrl = data.image.startsWith('http') 
              ? data.image 
              : `${axiosInstance.defaults.baseURL}${data.image}`;
            setExistingImage(imageUrl);
            setImagePreview(imageUrl);
          } else if (data.avatar_url) {
            const avatarUrl = data.avatar_url.startsWith('http') 
              ? data.avatar_url 
              : `${axiosInstance.defaults.baseURL}${data.avatar_url}`;
            setExistingImage(avatarUrl);
            setImagePreview(avatarUrl);
          }
        }

      } catch (e) {
        console.error('❌ Erreur:', e);
        if (e.response?.status === 404) {
          setError('Témoignage non trouvé');
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
    
    if (!file) {
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
      
      // Ajouter les champs texte
      formDataToSend.append('nom', formData.nom.trim());
      formDataToSend.append('role', formData.role?.trim() || '');
      formDataToSend.append('contenu', formData.contenu?.trim() || '');
      formDataToSend.append('note', formData.note || 5);
      formDataToSend.append('est_publie', formData.est_publie ? 'true' : 'false');
      formDataToSend.append('est_en_une', formData.est_en_une ? 'true' : 'false');
      formDataToSend.append('ordre', formData.ordre || 0);

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

      // Debug - Afficher le contenu de FormData
      console.log('📤 FormData envoyé:');
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type})`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      // Configuration pour axios avec FormData
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: [(data) => data],
      };

      let response;

      if (isEditing) {
        console.log(`📤 Mise à jour du témoignage ${id}...`);
        response = await axiosInstance.put(
          `/temoignages/${id}/`,
          formDataToSend,
          config
        );
        showMessage('✅ Témoignage modifié avec succès', 'success');
      } else {
        console.log('📤 Création du témoignage...');
        response = await axiosInstance.post(
          '/temoignages/',
          formDataToSend,
          config
        );
        showMessage('✅ Témoignage créé avec succès', 'success');
      }

      console.log('✅ Réponse:', response.data);

      // Rediriger vers la liste
      setTimeout(() => {
        navigate('/temoignages');
      }, 1500);

    } catch (e) {
      console.error('❌ Erreur:', e);
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
        showMessage('❌ Témoignage non trouvé', 'error');
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
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error}</h3>
          <button onClick={() => navigate('/temoignages')} className="mt-3 btn btn-primary">
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
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={() => setMessage('')} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
        
        {/* EN-TÊTE */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/temoignages')} 
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Quote className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Modifier le témoignage' : 'Nouveau témoignage'}
          </h1>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLONNE GAUCHE - Contenu principal */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de la personne"
                  required
                />
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Parent d'élève, Élève en Terminale, Enseignant"
                />
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Témoignage <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="contenu"
                  rows="6"
                  value={formData.contenu || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contenu du témoignage"
                  required
                />
              </div>
            </div>

            {/* COLONNE DROITE - Métadonnées */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({ ...formData, note: n })}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          n <= formData.note 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut Publication */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  name="est_publie"
                  checked={formData.est_publie}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Publié</label>
              </div>

              {/* À la une */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  name="est_en_une"
                  checked={formData.est_en_une}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">À la une</label>
              </div>

              {/* Ordre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  name="ordre"
                  value={formData.ordre || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Image - Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Aperçu" 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        type="button" 
                        onClick={removeImage} 
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                      <Users className="h-8 w-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-[200px]">
                    <input 
                      id="image-upload" 
                      type="file" 
                      name="image"
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF, WebP (max 5MB)
                    </p>
                    {existingImage && !imageFile && !imageDeleted && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Image actuelle conservée
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BOUTONS */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/temoignages')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
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

export default TemoignageForm;