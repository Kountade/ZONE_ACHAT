// src/components/evaluations/SemestreForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, X, Loader2, CalendarRange } from 'lucide-react';

const SemestreForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    type_periode: '',
    libelle: '',
    annee_scolaire: '',
    date_debut: '',
    date_fin: '',
    ordre: 0
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [anneesScolaires, setAnneesScolaires] = useState([]);
  const [message, setMessage] = useState('');

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          setMessage('❌ Session expirée');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Charger les années scolaires
        try {
          const anneeRes = await axiosInstance.get('/annees-scolaires/', headers);
          if (Array.isArray(anneeRes.data)) {
            setAnneesScolaires(anneeRes.data);
          } else if (anneeRes.data?.results) {
            setAnneesScolaires(anneeRes.data.results);
          } else {
            setAnneesScolaires([]);
          }
        } catch (e) {
          console.warn('⚠️ Erreur chargement années:', e);
          setAnneesScolaires([]);
        }

        // Si édition, charger la période
        if (isEditing) {
          try {
            const res = await axiosInstance.get(`/periodes/${id}/`, headers);
            const data = res.data || {};
            setFormData({
              type_periode: data.type_periode || '',
              libelle: data.libelle || '',
              annee_scolaire: data.annee_scolaire || '',
              date_debut: data.date_debut || '',
              date_fin: data.date_fin || '',
              ordre: data.ordre || 0
            });
          } catch (e) {
            if (e.response?.status === 404) {
              setError('Période non trouvée');
            } else {
              setMessage('❌ Erreur de chargement de la période');
            }
          }
        }

      } catch (e) {
        console.error('❌ Erreur:', e);
        setMessage('❌ Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        type_periode: formData.type_periode.trim(),
        libelle: formData.libelle.trim(),
        annee_scolaire: parseInt(formData.annee_scolaire),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        ordre: parseInt(formData.ordre) || 0
      };

      console.log('📤 Données envoyées:', dataToSend);

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/periodes/${id}/`, dataToSend, headers);
        setMessage('✅ Période modifiée avec succès');
      } else {
        response = await axiosInstance.post('/periodes/', dataToSend, headers);
        setMessage('✅ Période créée avec succès');
      }

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/periodes/${response.data.id}`);
        } else {
          navigate('/periodes');
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">
            {isEditing ? 'Chargement de la période...' : 'Préparation du formulaire...'}
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
          <button onClick={() => navigate('/periodes')} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">
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
            <div className="p-2 bg-blue-100 rounded-xl">
              <CalendarRange className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Modifier la période' : 'Nouvelle période'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifiez les informations de la période' : 'Créez une nouvelle période (Semestre/Trimestre)'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/periodes')} className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de période *
              </label>
              <input
                type="text"
                name="type_periode"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.type_periode || ''}
                onChange={handleChange}
                placeholder="Ex: Semestre 1, Trimestre 2, Quadrimestre..."
                required
              />
              <p className="text-xs text-gray-400 mt-1">Libre : vous pouvez saisir ce que vous voulez</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                name="libelle"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.libelle || ''}
                onChange={handleChange}
                placeholder="Ex: Semestre 1 - 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire *
              </label>
              <select
                name="annee_scolaire"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.annee_scolaire || ''}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez une année</option>
                {anneesScolaires.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.libelle || `Année ${a.annee_debut}-${a.annee_fin}`}
                  </option>
                ))}
              </select>
              {anneesScolaires.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Aucune année scolaire disponible. Veuillez en créer une d'abord.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  name="date_debut"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date_debut || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  name="date_fin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date_fin || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre d'affichage
              </label>
              <input
                type="number"
                name="ordre"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.ordre || 0}
                onChange={handleChange}
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Les périodes sont affichées par ordre croissant</p>
            </div>

          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
              onClick={() => navigate('/periodes')}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
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

export default SemestreForm;