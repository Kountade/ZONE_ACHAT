// src/pages/GestionProfesseursForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  UserCog,
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  BookOpen,
  Loader2,
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import toast from 'react-hot-toast';

const GestionProfesseursForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    specialite: '',
    diplomes: '',
    date_embauche: '',
    est_titulaire: true,
    est_actif: true,
    matieres_enseignees: [],
    classes_principales: []
  });

  useEffect(() => {
    fetchData();
    if (isEditing) {
      fetchProfesseur();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      console.log('🔄 Chargement des données...');
      const [matieresRes, classesRes] = await Promise.all([
        axiosInstance.get('/matieres/'),
        axiosInstance.get('/classes/'),
      ]);
      console.log('📚 Matières chargées:', matieresRes.data.length);
      console.log('📚 Classes chargées:', classesRes.data.length);
      setMatieres(matieresRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchProfesseur = async () => {
    try {
      console.log(`🔄 Chargement du professeur ${id}...`);
      const response = await axiosInstance.get(`/professeurs/${id}/`);
      const data = response.data;
      console.log('📋 Professeur chargé:', data);
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        date_naissance: data.date_naissance || '',
        specialite: data.specialite || '',
        diplomes: data.diplomes || '',
        date_embauche: data.date_embauche || '',
        est_titulaire: data.est_titulaire ?? true,
        est_actif: data.est_actif ?? true,
        matieres_enseignees: data.matieres_enseignees?.map(m => Number(m.id)) || [],
        classes_principales: data.classes_principales?.map(c => Number(c.id)) || []
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement du professeur:', error);
      toast.error('Erreur lors du chargement du professeur');
      navigate('/professeurs');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`🔄 Changement du champ ${name}:`, type === 'checkbox' ? checked : value);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelect = (e, field) => {
    console.log(`🔄 Sélection pour ${field}`);
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const value = parseInt(options[i].value, 10);
        if (!isNaN(value)) {
          selected.push(value);
        }
      }
    }
    console.log(`📋 Valeurs sélectionnées pour ${field}:`, selected);
    setFormData(prev => ({ 
      ...prev, 
      [field]: selected 
    }));
  };

  const validateForm = () => {
    console.log('🔍 Validation du formulaire...');
    const newErrors = {};
    
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.email?.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    console.log('📋 Erreurs de validation:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🟢 Formulaire soumis');
    console.log('📋 Données du formulaire:', formData);
    
    // Vérifier la validation
    const isValid = validateForm();
    console.log('✅ Formulaire valide:', isValid);
    
    if (!isValid) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone || '',
        adresse: formData.adresse || '',
        date_naissance: formData.date_naissance || null,
        specialite: formData.specialite || '',
        diplomes: formData.diplomes || '',
        date_embauche: formData.date_embauche || null,
        est_titulaire: formData.est_titulaire,
        est_actif: formData.est_actif,
        matieres_enseignees: formData.matieres_enseignees || [],
        classes_principales: formData.classes_principales || []
      };

      console.log('📦 Données à envoyer:', dataToSend);
      console.log('🔗 URL:', isEditing ? `/professeurs/${id}/` : '/professeurs/');

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/professeurs/${id}/`, dataToSend);
        console.log('✅ Réponse PUT:', response);
        toast.success('Professeur modifié avec succès');
      } else {
        response = await axiosInstance.post('/professeurs/', dataToSend);
        console.log('✅ Réponse POST:', response);
        toast.success('Professeur ajouté avec succès');
      }
      navigate('/professeurs');
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('❌ Impossible de contacter le serveur. Vérifiez que Django est lancé sur http://127.0.0.1:8000');
      } else if (error.response) {
        console.error('📄 Données de la réponse:', error.response.data);
        console.error('📊 Status:', error.response.status);
        
        if (error.response.status === 401) {
          toast.error('Session expirée, veuillez vous reconnecter');
          navigate('/login');
        } else if (error.response.status === 400) {
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            Object.keys(errorData).forEach(key => {
              const message = Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key];
              setErrors(prev => ({ ...prev, [key]: message }));
              console.log(`❌ Erreur sur ${key}:`, message);
            });
          }
          toast.error('Veuillez corriger les erreurs du formulaire');
        } else {
          toast.error(error.response.data?.message || 'Erreur lors de l\'enregistrement');
        }
      } else {
        toast.error('Erreur lors de l\'enregistrement du professeur');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Fin de la soumission');
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/professeurs')}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="w-8 h-8 text-primary" />
              {isEditing ? 'Modifier le professeur' : 'Ajouter un professeur'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-base-100 rounded-2xl shadow-xl p-6">
          {/* Informations personnelles */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nom <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                  placeholder="Dupont"
                />
                {errors.nom && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.nom}</span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Prénom <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${errors.prenom ? 'input-error' : ''}`}
                  placeholder="Jean"
                />
                {errors.prenom && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.prenom}</span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email <span className="text-error">*</span></span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                  placeholder="jean.dupont@ecole.com"
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.email}</span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Téléphone</span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Matières et Classes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              Enseignements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Matières enseignées</span>
                </label>
                <select
                  multiple
                  className="select select-bordered w-full h-32"
                  value={formData.matieres_enseignees}
                  onChange={(e) => handleMultiSelect(e, 'matieres_enseignees')}
                >
                  {matieres.map(matiere => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom} ({matiere.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Classes principales</span>
                </label>
                <select
                  multiple
                  className="select select-bordered w-full h-32"
                  value={formData.classes_principales}
                  onChange={(e) => handleMultiSelect(e, 'classes_principales')}
                >
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-base-200">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Modifier' : 'Ajouter'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/professeurs')}
              className="btn btn-ghost gap-2"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestionProfesseursForm;