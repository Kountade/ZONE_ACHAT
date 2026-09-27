// src/components/publicsite/PartenaireForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft,
  Save,
  X,
  Building2,
  AlertCircle,
  Upload,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  Image
} from 'lucide-react';

const PartenaireForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    url: '',
    description: '',
    ordre: 0,
    est_actif: true
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
  // État pour l'image - IDENTIQUE À GalerieForm
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
          showMessage('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Si édition, charger le partenaire
        if (isEditing) {
          const res = await axiosInstance.get(`/partenaires/${id}/`, headers);
          const data = res.data || {};
          
          setFormData({
            nom: data.nom || '',
            url: data.url || '',
            description: data.description || '',
            ordre: data.ordre || 0,
            est_actif: data.est_actif !== undefined ? data.est_actif : true
          });
          
          // ✅ CORRECTION : Utiliser l'URL de l'image existante comme GalerieForm
          if (data.image) {
            const imageUrl = data.image.startsWith('http') 
              ? data.image 
              : `${axiosInstance.defaults.baseURL}${data.image}`;
            setExistingImage(imageUrl);
            setImagePreview(imageUrl);
          }
        }

      } catch (e) {
        console.error('❌ Erreur:', e);
        if (e.response?.status === 404) {
          setError('Partenaire non trouvé');
        } else if (e.response?.status === 401) {
          showMessage('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          showMessage('Erreur de chargement', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, navigate]);

  // ============================================================
  // GESTION DE L'IMAGE - IDENTIQUE À GalerieForm
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
      showMessage('Le fichier est trop volumineux (max 5 Mo)', 'error');
      e.target.value = '';
      return;
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('Format non supporté. Utilisez JPG, PNG, GIF, SVG ou WebP.', 'error');
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
  // SOUMISSION - IDENTIQUE À GalerieForm
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showMessage('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Créer FormData
      const formDataToSend = new FormData();
      
      // ✅ Ajouter les champs texte
      formDataToSend.append('nom', formData.nom.trim());
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('ordre', String(parseInt(formData.ordre, 10) || 0));
      formDataToSend.append('est_actif', formData.est_actif ? 'true' : 'false');
      
      // URL - optionnelle
      if (formData.url && formData.url.trim()) {
        let urlValue = formData.url.trim();
        if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://')) {
          urlValue = 'https://' + urlValue;
        }
        formDataToSend.append('url', urlValue);
      }

      // ✅ Gérer l'image comme GalerieForm
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
        showMessage('Veuillez sélectionner une image', 'error');
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
        transformRequest: [(data) => data],
      };

      let response;

      if (isEditing) {
        console.log(`📤 Mise à jour du partenaire ${id}...`);
        response = await axiosInstance.put(
          `/partenaires/${id}/`,
          formDataToSend,
          config
        );
        showMessage('Partenaire modifié avec succès', 'success');
      } else {
        console.log('📤 Création du partenaire...');
        response = await axiosInstance.post(
          '/partenaires/',
          formDataToSend,
          config
        );
        showMessage('Partenaire créé avec succès', 'success');
      }

      console.log('✅ Réponse:', response.data);

      setTimeout(() => {
        navigate('/partenaires');
      }, 1500);

    } catch (e) {
      console.error('❌ Erreur détaillée:', e);
      console.error('❌ Response:', e.response);
      console.error('❌ Data:', e.response?.data);
      
      // Gestion des erreurs
      if (e.response?.status === 400) {
        const errors = Object.values(e.response.data).flat().join(', ');
        showMessage(`Erreur: ${errors}`, 'error');
      } else if (e.response?.status === 401) {
        showMessage('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (e.response?.status === 404) {
        showMessage('Partenaire non trouvé', 'error');
      } else {
        showMessage('Erreur lors de l\'enregistrement', 'error');
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
          <button onClick={() => navigate('/partenaires')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
      
      {/* Notification flottante */}
      {message && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`rounded-lg shadow-lg border-l-4 p-4 ${
            messageType === 'error' 
              ? 'bg-red-50 border-red-500 text-red-700' 
              : 'bg-green-50 border-green-500 text-green-700'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={() => setMessage('')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/partenaires')} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Modifier le partenaire' : 'Nouveau partenaire'}
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        <div className="w-full max-w-[1920px] mx-auto">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="bg-white rounded-2xl shadow-xl p-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* COLONNE GAUCHE - Informations */}
              <div className="space-y-6">
                
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du partenaire *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom du partenaire"
                    required
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Site web
                  </label>
                  <input
                    type="text"
                    name="url"
                    value={formData.url || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="exemple.com ou https://exemple.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Le protocole https:// sera ajouté automatiquement
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description du partenaire"
                  />
                </div>
              </div>

              {/* COLONNE DROITE - Métadonnées et Image */}
              <div className="space-y-6">
                
                {/* Ordre et Actif */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordre
                    </label>
                    <input
                      type="number"
                      name="ordre"
                      min="0"
                      value={formData.ordre || 0}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <div className="flex items-center gap-3 pt-2.5">
                      <input
                        type="checkbox"
                        name="est_actif"
                        checked={formData.est_actif !== undefined ? formData.est_actif : true}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Actif</span>
                    </div>
                  </div>
                </div>

                {/* ✅ IMAGE - IDENTIQUE À GalerieForm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Image className="h-4 w-4 inline mr-1" />
                    Image {!isEditing && '*'}
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-50">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="w-full h-full object-contain p-2" 
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
                      <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-[200px]">
                      <input 
                        id="image-upload" 
                        type="file" 
                        name="image"
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={!isEditing}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF, SVG, WebP (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* APERÇU */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Aperçu</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {imagePreview ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                        <img 
                          src={imagePreview} 
                          alt={formData.nom || 'Logo'} 
                          className="w-full h-full object-contain p-1" 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{formData.nom || 'Nom du partenaire'}</p>
                      {formData.url && (
                        <p className="text-sm text-blue-600 truncate max-w-[200px]">{formData.url}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${formData.est_actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {formData.est_actif ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="text-xs text-gray-400">Ordre: {formData.ordre || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOUTONS */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/partenaires')}
                    className="flex-1 px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" /> Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
    </div>
  );
};

export default PartenaireForm;