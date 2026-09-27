// src/components/evaluations/EvaluationForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, FileText, Calendar,
  BookOpen, Tag, Hash, AlertCircle
} from 'lucide-react';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    matiere: '',
    niveau: '',
    periode: '',
    type_evaluation: '',
    note_max: 20,
    note_min: 0,
    note_sur: 20,
    ponderation: 1.0,
    date_evaluation: '',
    heure_debut: '',
    heure_fin: '',
    duree: '',
    date_publication: '',
    statut: 'prevue',
    est_publie: false,
    bareme: {}
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const [matieres, setMatieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [typesEvaluation, setTypesEvaluation] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchDataSafely = async (url, headers) => {
    try {
      const res = await axiosInstance.get(url, headers);
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.results) return res.data.results;
      return [];
    } catch (error) {
      console.warn(`⚠️ Impossible de charger ${url}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingData(true);
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        const [matieresData, niveauxData, periodesData, typesData] = await Promise.all([
          fetchDataSafely('/matieres/', headers),
          fetchDataSafely('/niveaux/', headers),
          fetchDataSafely('/periodes/', headers),
          fetchDataSafely('/types-evaluation/', headers)
        ]);

        setMatieres(matieresData);
        setNiveaux(niveauxData);
        setPeriodes(periodesData);
        setTypesEvaluation(typesData);

        if (isEditing) {
          try {
            const evalRes = await axiosInstance.get(`/evaluations/${id}/`, headers);
            const data = evalRes.data || {};
            setFormData({
              titre: data.titre || '',
              description: data.description || '',
              matiere: data.matiere || '',
              niveau: data.niveau || '',
              periode: data.periode || '',
              type_evaluation: data.type_evaluation || '',
              note_max: data.note_max || 20,
              note_min: data.note_min || 0,
              note_sur: data.note_sur || 20,
              ponderation: data.ponderation || 1.0,
              date_evaluation: data.date_evaluation || '',
              heure_debut: data.heure_debut || '',
              heure_fin: data.heure_fin || '',
              duree: data.duree || '',
              date_publication: data.date_publication || '',
              statut: data.statut || 'prevue',
              est_publie: data.est_publie || false,
              bareme: data.bareme || {}
            });
          } catch (error) {
            if (error.response?.status === 404) setError('Évaluation non trouvée');
            else setError('Erreur de chargement');
          }
        }
      } catch (error) {
        setError('Erreur de chargement des données');
      } finally {
        setLoading(false);
        setLoadingData(false);
      }
    };
    fetchAllData();
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
        titre: formData.titre.trim(),
        description: formData.description?.trim() || '',
        matiere: parseInt(formData.matiere),
        niveau: parseInt(formData.niveau),
        periode: parseInt(formData.periode),
        type_evaluation: formData.type_evaluation ? parseInt(formData.type_evaluation) : null,
        note_max: parseFloat(formData.note_max) || 20,
        note_min: parseFloat(formData.note_min) || 0,
        note_sur: parseFloat(formData.note_sur) || 20,
        ponderation: parseFloat(formData.ponderation) || 1.0,
        date_evaluation: formData.date_evaluation,
        heure_debut: formData.heure_debut || null,
        heure_fin: formData.heure_fin || null,
        duree: formData.duree ? parseInt(formData.duree) : null,
        date_publication: formData.date_publication || null,
        statut: formData.statut || 'prevue',
        est_publie: formData.est_publie || false,
        bareme: formData.bareme || {}
      };

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/evaluations/${id}/`, dataToSend, headers);
        setMessage('✅ Évaluation modifiée avec succès');
      } else {
        response = await axiosInstance.post('/evaluations/', dataToSend, headers);
        setMessage('✅ Évaluation créée avec succès');
      }

      setTimeout(() => {
        if (response?.data?.id) navigate(`/evaluations/${response.data.id}`);
        else navigate('/evaluations');
      }, 1500);

    } catch (error) {
      if (error.response?.data) {
        const errors = Object.values(error.response.data).flat().join(', ');
        setMessage(`❌ ${errors}`);
      } else {
        setMessage('❌ Erreur lors de l\'enregistrement');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const calculateDuree = () => {
    if (formData.heure_debut && formData.heure_fin) {
      try {
        const debut = new Date(`2000-01-01T${formData.heure_debut}`);
        const fin = new Date(`2000-01-01T${formData.heure_fin}`);
        const diffMinutes = Math.round((fin - debut) / (1000 * 60));
        if (diffMinutes > 0) setFormData(prev => ({ ...prev, duree: diffMinutes }));
      } catch (e) {}
    }
  };

  useEffect(() => {
    calculateDuree();
  }, [formData.heure_debut, formData.heure_fin]);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">
            {isEditing ? 'Chargement...' : 'Préparation...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600 mt-3">{error}</h3>
          <button onClick={() => navigate('/evaluations')} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL COMPACT
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">
      
      {/* MESSAGE */}
      {message && (
        <div className={`w-full px-4 py-2 text-sm ${
          message.includes('✅') ? 'bg-green-100 text-green-800 border-b border-green-300' : 
          'bg-red-100 text-red-800 border-b border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message}</span>
            <button className="font-bold" onClick={() => setMessage('')}>✕</button>
          </div>
        </div>
      )}

      {/* EN-TÊTE COMPACT */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
              </h1>
            </div>
          </div>
          <button onClick={() => navigate('/evaluations')} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      {/* FORMULAIRE COMPACT */}
      <div className="w-full px-4 py-3">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* CARD GAUCHE - Informations générales + Matière/Niveau/Période */}
            <div className="space-y-3">
              
              {/* Card: Informations générales */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Informations générales
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Titre *</label>
                    <input
                      type="text"
                      name="titre"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.titre || ''}
                      onChange={handleChange}
                      placeholder="Titre de l'évaluation"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
                    <textarea
                      name="description"
                      rows="2"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.description || ''}
                      onChange={handleChange}
                      placeholder="Description..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Statut</label>
                    <select
                      name="statut"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.statut || 'prevue'}
                      onChange={handleChange}
                    >
                      <option value="prevue">Prévue</option>
                      <option value="en_cours">En cours</option>
                      <option value="terminee">Terminée</option>
                      <option value="annulee">Annulée</option>
                      <option value="reportee">Reportée</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card: Matière, Niveau, Période */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Matière, Niveau & Période
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Matière *</label>
                    <select
                      name="matiere"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.matiere || ''}
                      onChange={handleSelectChange}
                      required
                    >
                      <option value="">Sélectionnez</option>
                      {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Niveau *</label>
                    <select
                      name="niveau"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.niveau || ''}
                      onChange={handleSelectChange}
                      required
                    >
                      <option value="">Sélectionnez</option>
                      {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Période *</label>
                    <select
                      name="periode"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.periode || ''}
                      onChange={handleSelectChange}
                      required
                    >
                      <option value="">Sélectionnez</option>
                      {periodes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Type d'évaluation</label>
                    <select
                      name="type_evaluation"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.type_evaluation || ''}
                      onChange={handleSelectChange}
                    >
                      <option value="">Sélectionnez</option>
                      {typesEvaluation.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD DROITE - Barème + Date/Heure + Options */}
            <div className="space-y-3">
              
              {/* Card: Barème */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  Barème
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Note max</label>
                    <input
                      type="number"
                      name="note_max"
                      step="0.5"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.note_max || 20}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Note min</label>
                    <input
                      type="number"
                      name="note_min"
                      step="0.5"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.note_min || 0}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Note sur</label>
                    <input
                      type="number"
                      name="note_sur"
                      step="0.5"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.note_sur || 20}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Pondération</label>
                  <input
                    type="number"
                    name="ponderation"
                    step="0.1"
                    min="0.1"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.ponderation || 1.0}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Card: Date et heure */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Date et heure
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Date *</label>
                    <input
                      type="date"
                      name="date_evaluation"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.date_evaluation || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Heure début</label>
                    <input
                      type="time"
                      name="heure_debut"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.heure_debut || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Heure fin</label>
                    <input
                      type="time"
                      name="heure_fin"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.heure_fin || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Durée (min)</label>
                    <input
                      type="number"
                      name="duree"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50"
                      value={formData.duree || ''}
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Date de publication</label>
                  <input
                    type="date"
                    name="date_publication"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.date_publication || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Card: Options */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="est_publie"
                    checked={formData.est_publie || false}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Publier les résultats</span>
                </label>
              </div>

              {/* BOUTONS */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1.5"
                  onClick={() => navigate('/evaluations')}
                >
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5 flex-1 justify-center disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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

export default EvaluationForm;