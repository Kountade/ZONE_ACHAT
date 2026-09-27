// src/components/publicsite/ProgrammeForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

const ProgrammeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    contenu: '',
    extrait: '',
    categorie: '',
    niveau: 'tous',
    duree: '3_ans',
    prix: '',
    image_alt: '',
    statut: 'brouillon',
    date_publication: '',
    est_populaire: false,
    points_forts: [],
    matieres: [],
    debouches: [],
    meta_title: '',
    meta_description: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [categories, setCategories] = useState([]);
  
  const [pointFortInput, setPointFortInput] = useState('');
  const [matiereInput, setMatiereInput] = useState('');
  const [deboucheInput, setDeboucheInput] = useState('');
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDeleted, setImageDeleted] = useState(false);

  const NIVEAUX = [
    { value: 'primaire', label: 'Primaire' },
    { value: 'college', label: 'College' },
    { value: 'lycee', label: 'Lycee' },
    { value: 'tous', label: 'Tous niveaux' },
  ];

  const DUREES = [
    { value: '1_an', label: '1 an' },
    { value: '2_ans', label: '2 ans' },
    { value: '3_ans', label: '3 ans' },
    { value: '4_ans', label: '4 ans' },
    { value: '5_ans', label: '5 ans' },
    { value: 'variable', label: 'Variable' },
  ];

  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          showMessage('Session expiree', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        const catRes = await axiosInstance.get('/categories/', headers);
        let catData = [];
        if (Array.isArray(catRes.data)) {
          catData = catRes.data;
        } else if (catRes.data?.results) {
          catData = catRes.data.results;
        }
        setCategories(catData);

        if (isEditing) {
          const res = await axiosInstance.get(`/programmes/${id}/`, headers);
          const data = res.data || {};
          
          let datePublication = '';
          if (data.date_publication) {
            const dateObj = new Date(data.date_publication);
            if (!isNaN(dateObj.getTime())) {
              datePublication = dateObj.toISOString().slice(0, 16);
            }
          }

          setFormData({
            titre: data.titre || '',
            description: data.description || '',
            contenu: data.contenu || '',
            extrait: data.extrait || '',
            categorie: data.categorie || '',
            niveau: data.niveau || 'tous',
            duree: data.duree || '3_ans',
            prix: data.prix || '',
            image_alt: data.image_alt || '',
            statut: data.statut || 'brouillon',
            date_publication: datePublication,
            est_populaire: data.est_populaire || false,
            points_forts: data.points_forts || [],
            matieres: data.matieres || [],
            debouches: data.debouches || [],
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
          });
          
          if (data.image) {
            const imageUrl = `${axiosInstance.defaults.baseURL}${data.image}`;
            setImagePreview(imageUrl);
          }
        }

      } catch (e) {
        console.error('Erreur:', e);
        if (e.response?.status === 404) {
          setError('Programme non trouve');
        } else if (e.response?.status === 401) {
          showMessage('Session expiree', 'error');
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Le fichier est trop volumineux (max 5 Mo)', 'error');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('Format non supporte. Utilisez JPG, PNG, GIF ou WebP.', 'error');
      e.target.value = '';
      return;
    }
    
    setImageFile(file);
    setImageDeleted(false);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageDeleted(true);
    setImagePreview(null);
    const input = document.getElementById('image-upload');
    if (input) input.value = '';
  };

  const addItem = (list, setList, input, setInput, fieldName) => {
    if (input.trim()) {
      setList([...list, input.trim()]);
      setInput('');
    } else {
      showMessage(`Veuillez saisir un ${fieldName}`, 'error');
    }
  };

  const removeItem = (list, setList, index) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showMessage('Session expiree', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const formDataToSend = new FormData();
      
      formDataToSend.append('titre', formData.titre.trim());
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('contenu', formData.contenu?.trim() || '');
      formDataToSend.append('extrait', formData.extrait?.trim() || '');
      
      if (formData.categorie) {
        formDataToSend.append('categorie', formData.categorie);
      }
      
      formDataToSend.append('niveau', formData.niveau || 'tous');
      formDataToSend.append('duree', formData.duree || '3_ans');
      
      if (formData.prix) {
        formDataToSend.append('prix', formData.prix.trim());
      }
      
      formDataToSend.append('statut', formData.statut || 'brouillon');
      formDataToSend.append('est_populaire', formData.est_populaire ? 'true' : 'false');
      
      if (formData.image_alt) {
        formDataToSend.append('image_alt', formData.image_alt.trim());
      }
      
      if (formData.date_publication) {
        const dateObj = new Date(formData.date_publication);
        if (!isNaN(dateObj.getTime())) {
          formDataToSend.append('date_publication', dateObj.toISOString());
        }
      }

      if (formData.points_forts.length > 0) {
        formDataToSend.append('points_forts', JSON.stringify(formData.points_forts));
      }
      if (formData.matieres.length > 0) {
        formDataToSend.append('matieres', JSON.stringify(formData.matieres));
      }
      if (formData.debouches.length > 0) {
        formDataToSend.append('debouches', JSON.stringify(formData.debouches));
      }

      if (formData.meta_title) {
        formDataToSend.append('meta_title', formData.meta_title.trim());
      }
      if (formData.meta_description) {
        formDataToSend.append('meta_description', formData.meta_description.trim());
      }

      if (imageFile && imageFile instanceof File) {
        formDataToSend.append('image', imageFile);
      } else if (imageDeleted && isEditing) {
        formDataToSend.append('image_clear', 'true');
      }

      const config = {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      let response;

      if (isEditing) {
        response = await axiosInstance.put(
          `/programmes/${id}/`,
          formDataToSend,
          config
        );
        showMessage('Programme modifie avec succes', 'success');
      } else {
        response = await axiosInstance.post(
          '/programmes/',
          formDataToSend,
          config
        );
        showMessage('Programme cree avec succes', 'success');
      }

      setTimeout(() => {
        if (response?.data?.id) {
          navigate(`/programmes/${response.data.id}`);
        } else {
          navigate('/programes');
        }
      }, 1500);

    } catch (e) {
      console.error('Erreur:', e);
      if (e.response?.status === 400) {
        const errors = Object.values(e.response.data).flat().join(', ');
        showMessage(`Erreur: ${errors}`, 'error');
      } else if (e.response?.status === 401) {
        showMessage('Session expiree', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ color: '#6b7280', marginTop: '12px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column' }}>
        <h3 style={{ color: '#dc2626' }}>{error}</h3>
        <button 
          onClick={() => navigate('/programes')} 
          style={{ marginTop: '10px', padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          padding: '12px 24px',
          borderRadius: '8px',
          background: messageType === 'error' ? '#dc2626' : '#22c55e',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            style={{ marginLeft: '15px', background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '30px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => navigate('/programes')} 
            style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}
          >
            {'<'}
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {isEditing ? 'Modifier le programme' : 'Nouveau programme'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Ligne 1: Titre - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Titre du programme *</label>
              <input
                type="text"
                name="titre"
                value={formData.titre || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                placeholder="Titre du programme"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Categorie</label>
              <select
                name="categorie"
                value={formData.categorie || ''}
                onChange={handleSelectChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                <option value="">Selectionnez une categorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 2: Description - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Description *</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                placeholder="Description du programme"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Extrait / Resume</label>
              <textarea
                name="extrait"
                rows="3"
                value={formData.extrait || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                placeholder="Resume du programme (500 caracteres max)"
                maxLength="500"
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {formData.extrait?.length || 0}/500 caracteres
              </div>
            </div>
          </div>

          {/* Ligne 3: Niveau + Duree - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Niveau</label>
              <select
                name="niveau"
                value={formData.niveau || 'tous'}
                onChange={handleSelectChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                {NIVEAUX.map(niv => (
                  <option key={niv.value} value={niv.value}>{niv.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Duree</label>
              <select
                name="duree"
                value={formData.duree || '3_ans'}
                onChange={handleSelectChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                {DUREES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 4: Prix + Statut - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Prix / Tarif</label>
              <input
                type="text"
                name="prix"
                value={formData.prix || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                placeholder="Ex: Gratuit, Sur devis, 500 000 FCFA"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Statut</label>
              <select
                name="statut"
                value={formData.statut || 'brouillon'}
                onChange={handleSelectChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                <option value="brouillon">Brouillon</option>
                <option value="publie">Publie</option>
                <option value="archive">Archive</option>
              </select>
            </div>
          </div>

          {/* Ligne 5: Date publication + Populaire - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Date de publication</label>
              <input
                type="datetime-local"
                name="date_publication"
                value={formData.date_publication || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '30px' }}>
              <label style={{ fontWeight: '500' }}>Programme populaire</label>
              <input
                type="checkbox"
                name="est_populaire"
                checked={formData.est_populaire || false}
                onChange={handleChange}
                style={{ width: '20px', height: '20px' }}
              />
            </div>
          </div>

          {/* Ligne 6: Contenu - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Contenu detaille</label>
              <textarea
                name="contenu"
                rows="10"
                value={formData.contenu || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'monospace' }}
                placeholder="Contenu detaille du programme"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Points forts</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={pointFortInput}
                  onChange={(e) => setPointFortInput(e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Ajouter un point fort"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(formData.points_forts, (v) => setFormData({...formData, points_forts: v}), pointFortInput, setPointFortInput, 'point fort');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addItem(formData.points_forts, (v) => setFormData({...formData, points_forts: v}), pointFortInput, setPointFortInput, 'point fort')}
                  style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {formData.points_forts.map((item, index) => (
                  <span key={index} style={{ background: '#dbeafe', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(formData.points_forts, (v) => setFormData({...formData, points_forts: v}), index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 7: Matieres + Debouches - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Matieres enseignees</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={matiereInput}
                  onChange={(e) => setMatiereInput(e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Ajouter une matiere"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(formData.matieres, (v) => setFormData({...formData, matieres: v}), matiereInput, setMatiereInput, 'matiere');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addItem(formData.matieres, (v) => setFormData({...formData, matieres: v}), matiereInput, setMatiereInput, 'matiere')}
                  style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {formData.matieres.map((item, index) => (
                  <span key={index} style={{ background: '#fce7f3', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(formData.matieres, (v) => setFormData({...formData, matieres: v}), index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Debouches</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={deboucheInput}
                  onChange={(e) => setDeboucheInput(e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Ajouter un debouche"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(formData.debouches, (v) => setFormData({...formData, debouches: v}), deboucheInput, setDeboucheInput, 'debouche');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addItem(formData.debouches, (v) => setFormData({...formData, debouches: v}), deboucheInput, setDeboucheInput, 'debouche')}
                  style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {formData.debouches.map((item, index) => (
                  <span key={index} style={{ background: '#fef3c7', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(formData.debouches, (v) => setFormData({...formData, debouches: v}), index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 8: SEO - 2 colonnes */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>SEO & Metadonnees</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Titre SEO</label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title || ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Titre SEO"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Description SEO</label>
                <textarea
                  name="meta_description"
                  rows="3"
                  value={formData.meta_description || ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  placeholder="Description SEO"
                />
              </div>
            </div>
          </div>

          {/* Ligne 9: Image - 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Image de couverture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {imagePreview ? (
                  <div style={{ width: '96px', height: '96px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb', position: 'relative', flexShrink: 0 }}>
                    <img src={imagePreview} alt="Apercu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={removeImage} 
                      style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '4px', border: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '96px', height: '96px', borderRadius: '12px', border: '2px dashed #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9ca3af' }}>
                    Image
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input 
                    id="image-upload" 
                    type="file" 
                    name="image"
                    accept="image/*" 
                    onChange={handleImageChange} 
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    PNG, JPG, GIF, WebP (max 5MB)
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Texte alternatif (SEO)</label>
              <input
                type="text"
                name="image_alt"
                value={formData.image_alt || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                placeholder="Texte alternatif pour l'image"
              />
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/programes')}
              style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Creer'}
            </button>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProgrammeForm;