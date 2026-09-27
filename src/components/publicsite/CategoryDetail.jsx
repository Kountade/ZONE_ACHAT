// src/components/publicsite/CategoryDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { 
  ArrowLeft, Edit, Trash2, Loader2, Tag, AlertCircle, 
  CheckCircle, X, Hash
} from 'lucide-react';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT - UNIQUEMENT LA CATÉGORIE
  // ============================================================
  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };
        
        console.log('📡 Appel API:', `/categories/${id}/`);
        const res = await axiosInstance.get(`/categories/${id}/`, headers);
        console.log('📦 Catégorie reçue:', res.data);
        
        setCategory(res.data);

      } catch (error) {
        console.error('❌ Erreur détaillée:', error);
        console.error('❌ Response:', error.response);
        
        if (error.response?.status === 404) {
          setError('Catégorie non trouvée');
        } else if (error.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Erreur de chargement de la catégorie');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id, navigate]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/categories/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Catégorie supprimée avec succès', 'success');
      setTimeout(() => navigate('/categories'), 1500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
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
  if (error || !category) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error || 'Non trouvée'}</h3>
          <button onClick={() => navigate('/categories')} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            Retour aux catégories
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
      
      {/* NOTIFICATION */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 mt-1">Voulez-vous supprimer "{category.nom}" ?</p>
              <p className="text-xs text-red-500 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button 
                className="flex-1 px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="flex-1 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1.5"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/categories')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: category.couleur || '#3b82f6' }}
            >
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{category.nom}</h1>
              <p className="text-xs text-gray-500">Slug: {category.slug || '-'}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Link to={`/categories/${id}/modifier`} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Modifier
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* CONTENU - UNIQUEMENT LES INFOS DE LA CATÉGORIE */}
      <div className="w-full px-4 py-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Carte Informations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" />
              Informations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{category.nom}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Slug</span>
                  <span className="font-medium">{category.slug || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Ordre</span>
                  <span className="font-medium">{category.ordre || 0}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Couleur</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: category.couleur || '#3b82f6' }}
                    />
                    <span className="font-mono text-sm">{category.couleur || '#3b82f6'}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Statut</span>
                  {category.est_active !== false ? (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Actif
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5">
                      <X className="w-3 h-3" /> Inactif
                    </span>
                  )}
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Articles</span>
                  <span className="font-medium">{category.nombre_articles || 0}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {category.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            )}

            {/* Audit */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Audit</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Créé le</span>
                  <p className="font-medium">
                    {category.date_creation ? new Date(category.date_creation).toLocaleString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Modifié le</span>
                  <p className="font-medium">
                    {category.date_modification ? new Date(category.date_modification).toLocaleString('fr-FR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;