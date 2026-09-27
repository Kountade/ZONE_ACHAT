// src/components/publicsite/ProgrammeDetail.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, BookCopy, Edit, Trash2, AlertCircle, Loader2,
  Calendar, Tag, GraduationCap, Clock, Award, Star,
  CheckCircle, X, Globe, Users, BookOpen, FileText,
  Eye, MoreVertical, Share2, Download
} from 'lucide-react';

const ProgrammeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  console.log('📄 ProgrammeDetail chargé');
  console.log('📦 ID:', id);

  const NIVEAUX = {
    'primaire': 'Primaire',
    'college': 'Collège',
    'lycee': 'Lycée',
    'tous': 'Tous niveaux',
  };

  const DUREES = {
    '1_an': '1 an',
    '2_ans': '2 ans',
    '3_ans': '3 ans',
    '4_ans': '4 ans',
    '5_ans': '5 ans',
    'variable': 'Variable',
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchProgramme = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };
      const res = await axiosInstance.get(`/programmes/${id}/`, headers);
      setProgramme(res.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        setError('Programme non trouvé');
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur de chargement du programme');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProgramme();
    } else {
      setError('ID du programme manquant');
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/programmes/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Programme supprimé avec succès', 'success');
      setTimeout(() => navigate('/programes'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'publie': 'badge-success',
      'brouillon': 'badge-warning',
      'archive': 'badge-ghost'
    };
    const labels = {
      'publie': 'Publié',
      'brouillon': 'Brouillon',
      'archive': 'Archivé'
    };
    return { class: map[statut] || 'badge-ghost', label: labels[statut] || statut };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement du programme...
          </p>
        </div>
      </div>
    );
  }

  if (error || !programme) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error">{error || 'Programme non trouvé'}</h3>
          <p className="text-gray-500 mt-2">Le programme que vous recherchez n'existe pas ou a été supprimé.</p>
          <button onClick={() => navigate('/programes')} className="btn btn-primary mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce programme ?</p>
              <p className="font-semibold text-error mt-2">{programme.titre}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="w-4 h-4" /> {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/programes')} className="btn btn-ghost btn-sm btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookCopy className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">{programme.titre}</h1>
              <p className="text-sm text-base-content/60">
                {programme.categorie_nom || 'Sans catégorie'} • {formatDate(programme.date_publication || programme.date_creation)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/programes/${id}/modifier`} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm sm:btn-md btn-error gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne principale - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Image */}
          {programme.image_url && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <img 
                src={programme.image_url} 
                alt={programme.image_alt || programme.titre}
                className="w-full h-64 md:h-80 lg:h-96 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {programme.image_alt && (
                <div className="p-3 bg-gray-50 text-sm text-gray-500">
                  {programme.image_alt}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{programme.description}</p>
          </div>

          {/* Contenu détaillé */}
          {programme.contenu && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Contenu détaillé
              </h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: programme.contenu }} />
            </div>
          )}

          {/* Points forts */}
          {programme.points_forts && programme.points_forts.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Points forts
              </h2>
              <ul className="space-y-2">
                {programme.points_forts.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Matières */}
          {programme.matieres && programme.matieres.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> Matières enseignées
              </h2>
              <div className="flex flex-wrap gap-2">
                {programme.matieres.map((matiere, index) => (
                  <span key={index} className="badge badge-primary badge-lg px-4 py-2 text-sm">
                    {matiere}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Débouchés */}
          {programme.debouches && programme.debouches.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" /> Débouchés
              </h2>
              <ul className="space-y-2">
                {programme.debouches.map((debouche, index) => (
                  <li key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{debouche}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Colonne droite - Informations */}
        <div className="space-y-6">
          
          {/* Carte d'informations */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Informations
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Catégorie</p>
                  <p className="font-medium">{programme.categorie_nom || 'Non catégorisé'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Niveau</p>
                  <p className="font-medium">{NIVEAUX[programme.niveau] || programme.niveau}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Durée</p>
                  <p className="font-medium">{DUREES[programme.duree] || programme.duree}</p>
                </div>
              </div>

              {programme.prix && (
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tarif</p>
                    <p className="font-medium">{programme.prix}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date de publication</p>
                  <p className="font-medium">{formatDate(programme.date_publication || programme.date_creation)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <span className={`badge ${getStatutBadge(programme.statut).class}`}>
                    {getStatutBadge(programme.statut).label}
                  </span>
                </div>
              </div>

              {programme.est_populaire && (
                <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <Star className="w-5 h-5 text-warning" />
                  <p className="text-sm font-medium text-warning">Programme populaire</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MoreVertical className="w-4 h-4" /> Actions rapides
            </h3>
            <div className="space-y-2">
              <Link 
                to={`/programes/${id}/modifier`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
              <Link 
                to="/programes"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BookCopy className="w-4 h-4" /> Voir tous les programmes
              </Link>
            </div>
          </div>

          {/* SEO & Métadonnées */}
          {(programme.meta_title || programme.meta_description) && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" /> SEO & Métadonnées
              </h3>
              {programme.meta_title && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Titre SEO</p>
                  <p className="text-sm font-medium">{programme.meta_title}</p>
                </div>
              )}
              {programme.meta_description && (
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Description SEO</p>
                  <p className="text-sm text-gray-700">{programme.meta_description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgrammeDetail;