// src/components/comptabilite/CaisseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { ArrowLeft, Save, X, Loader2, Wallet } from 'lucide-react';

const CaisseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    type_caisse: 'principale',
    solde_initial: 0,
    responsable: null,
    est_active: true
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
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

        // 1. Charger les utilisateurs
        try {
          const usersRes = await axiosInstance.get('/users/', headers);
          if (Array.isArray(usersRes.data)) {
            setUsers(usersRes.data);
          } else if (usersRes.data?.results) {
            setUsers(usersRes.data.results);
          }
        } catch (e) {
          console.warn('⚠️ Erreur chargement utilisateurs:', e);
        }

        // 2. Si édition, charger la caisse
        if (isEditing) {
          try {
            const res = await axiosInstance.get(`/caisses/${id}/`, headers);
            const data = res.data || {};
            setFormData({
              nom: data.nom || '',
              type_caisse: data.type_caisse || 'principale',
              solde_initial: parseFloat(data.solde_initial) || 0,
              responsable: data.responsable || null,
              est_active: data.est_active !== undefined ? data.est_active : true
            });
          } catch (e) {
            if (e.response?.status === 404) {
              setError('Caisse non trouvée');
            } else {
              setMessage('❌ Erreur de chargement de la caisse');
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
        nom: formData.nom.trim(),
        type_caisse: formData.type_caisse,
        solde_initial: parseFloat(formData.solde_initial) || 0,
        responsable: formData.responsable || null,
        est_active: formData.est_active
      };

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/caisses/${id}/`, dataToSend, headers);
        setMessage('✅ Caisse modifiée avec succès');
      } else {
        response = await axiosInstance.post('/caisses/', dataToSend, headers);
        setMessage('✅ Caisse créée avec succès');
      }

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/caisses/${response.data.id}`);
        } else {
          navigate('/caisses');
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
        setMessage('❌ Vous n\'avez pas la permission de faire cette action.');
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">
            {isEditing ? 'Chargement de la caisse...' : 'Préparation du formulaire...'}
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
          <button 
            onClick={() => navigate('/caisses')} 
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
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
      
      {/* MESSAGE DE NOTIFICATION */}
      {message && (
        <div className={`max-w-3xl mx-auto mb-4 p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{message}</span>
            <button 
              className="text-gray-500 hover:text-gray-700 font-bold ml-4"
              onClick={() => setMessage('')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Modifier la caisse' : 'Nouvelle caisse'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifiez les informations de la caisse' : 'Créez une nouvelle caisse'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/caisses')} 
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      {/* FORMULAIRE */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* NOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la caisse *
              </label>
              <input
                type="text"
                name="nom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.nom || ''}
                onChange={handleChange}
                placeholder="Ex: Caisse principale"
                required
              />
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de caisse *
              </label>
              <select
                name="type_caisse"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.type_caisse || 'principale'}
                onChange={handleChange}
                required
              >
                <option value="principale">Principale</option>
                <option value="secondaire">Secondaire</option>
              </select>
            </div>

            {/* SOLDE INITIAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solde initial
              </label>
              <input
                type="number"
                name="solde_initial"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.solde_initial || 0}
                onChange={handleChange}
                placeholder="0"
                disabled={isEditing}
              />
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">⚠️ Le solde initial ne peut pas être modifié</p>
              )}
            </div>

            {/* RESPONSABLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable
              </label>
              <select
                name="responsable"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.responsable || ''}
                onChange={handleChange}
              >
                <option value="">Non assigné</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || ''} {user.last_name || ''} 
                    {user.email ? ` (${user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUT */}
            <div>
              <label className="flex items-center gap-4 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Caisse active</span>
                <input
                  type="checkbox"
                  name="est_active"
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.est_active !== undefined ? formData.est_active : true}
                  onChange={handleChange}
                />
              </label>
            </div>

          </div>

          {/* BOUTONS */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/caisses')}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaisseForm;