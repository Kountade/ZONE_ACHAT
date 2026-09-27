// src/components/publicsite/ArticleDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, Loader2, FileText, AlertCircle,
  Calendar, Clock, Eye, User, Tag, BookOpen, Globe,
  CheckCircle, X, Heart, MessageSquare, Share2
} from 'lucide-react';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
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
  // CHARGEMENT
  // ============================================================
  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      
      const res = await axiosInstance.get(`/articles/${id}/`, headers);
      console.log('📦 Article:', res.data);
      setArticle(res.data);

    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.status === 404) {
        setError('Article non trouvé');
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchArticle();
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/articles/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Article supprimé avec succès', 'success');
      setTimeout(() => navigate('/articles'), 1500);
    } catch (error) {
      console.error('❌ Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatutBadge = (statut) => {
    const configs = {
      'publie': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'brouillon': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'archive': { color: 'bg-gray-100 text-gray-600', icon: X }
    };
    const config = configs[statut] || configs['brouillon'];
    const Icon = config.icon;
    return (
      <span className={`${config.color} px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5`}>
        <Icon className="w-3.5 h-3.5" /> {statut || 'Brouillon'}
      </span>
    );
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
  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error || 'Non trouvé'}</h3>
          <button onClick={() => navigate('/articles')} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">
            Retour aux articles
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
              <p className="text-sm text-gray-600 mt-1">Voulez-vous supprimer "{article.titre}" ?</p>
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
            <button onClick={() => navigate('/articles')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 line-clamp-1">{article.titre}</h1>
              <p className="text-xs text-gray-500">
                {article.categorie_nom || 'Sans catégorie'} • {formatDate(article.date_publication || article.date_creation)}
              </p>
            </div>
            {getStatutBadge(article.statut)}
          </div>
          <div className="flex gap-1.5">
            <Link to={`/articles/${id}/modifier`} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Modifier
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="w-full px-4 py-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Image de couverture */}
          {article.image && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-sm">
              <img 
                src={article.image} 
                alt={article.image_alt || article.titre}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Extrait */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <p className="text-gray-700 italic">{article.extrait}</p>
          </div>

          {/* Contenu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: article.contenu }} />
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Infos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Informations
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-medium">{article.categorie_nom || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Auteur</span>
                  <span className="font-medium">{article.auteur_nom || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Temps de lecture</span>
                  <span className="font-medium">{article.temps_lecture || 5} min</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Vues</span>
                  <span className="font-medium">{article.vues || 0}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-blue-600" />
                Statistiques
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-600">{article.vues || 0}</p>
                  <p className="text-[10px] text-gray-500">Vues</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-500">{article.likes || 0}</p>
                  <p className="text-[10px] text-gray-500">Likes</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-600">{article.commentaires_count || 0}</p>
                  <p className="text-[10px] text-gray-500">Commentaires</p>
                </div>
              </div>
            </div>

          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO */}
          {(article.meta_title || article.meta_description) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                SEO
              </h3>
              <div className="space-y-1 text-sm">
                {article.meta_title && (
                  <div>
                    <span className="text-gray-500">Meta Title:</span>
                    <p className="font-medium">{article.meta_title}</p>
                  </div>
                )}
                {article.meta_description && (
                  <div>
                    <span className="text-gray-500">Meta Description:</span>
                    <p className="font-medium">{article.meta_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Créé le</span>
                <p className="font-medium">
                  {article.date_creation ? new Date(article.date_creation).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Modifié le</span>
                <p className="font-medium">
                  {article.date_modification ? new Date(article.date_modification).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;