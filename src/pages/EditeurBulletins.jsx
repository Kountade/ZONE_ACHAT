// src/pages/EditeurBulletins.jsx - Version Design Libre
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileText, Save, Download, Printer, Send, Eye, RefreshCw,
  CheckCircle, AlertCircle, Loader2, X, ArrowLeft,
  School, User, CalendarDays, GraduationCap, Award,
  TrendingUp, Star, Plus, Trash2, Edit, Pen, Table,
  BarChart3, Layout, Type, Palette, Move, Copy,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Underline, List, ListOrdered, Link, Code, Grid,
  Maximize2, Minimize2, Settings, Upload, FolderOpen,
  FileSpreadsheet, Users, Calendar, Clock, CheckSquare,
  Minus, PlusCircle, MinusCircle, GripVertical, 
  Circle, Square, Hexagon, Image, Video, Music,
  Hash, Quote, AlignJustify, Baseline, PaintBucket,
  Brush, Eraser, Undo, Redo, ZoomIn, ZoomOut
} from 'lucide-react';

// ============================================================
// COMPOSANTS DE BLOCS (éléments que l'utilisateur peut ajouter)
// ============================================================

const BlockTypes = {
  HEADER: 'header',
  TEXT: 'text',
  TABLE: 'table',
  CHART: 'chart',
  STATS: 'stats',
  APPRECIATION: 'appreciation',
  FOOTER: 'footer',
  DIVIDER: 'divider',
  CUSTOM: 'custom'
};

const BlockColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
  white: '#ffffff',
  black: '#111827'
};

// ============================================================
// COMPOSANT BLOC INDIVIDUEL
// ============================================================

const EditableBlock = ({ block, onUpdate, onDelete, onMove, isSelected, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);

  const getBlockStyles = () => {
    const styles = {
      padding: block.styles?.padding || '16px',
      margin: block.styles?.margin || '0px',
      backgroundColor: block.styles?.backgroundColor || 'transparent',
      color: block.styles?.color || '#111827',
      borderRadius: block.styles?.borderRadius || '0px',
      border: block.styles?.border || 'none',
      textAlign: block.styles?.textAlign || 'left',
      fontFamily: block.styles?.fontFamily || 'Arial, sans-serif',
      fontSize: block.styles?.fontSize || '14px',
      fontWeight: block.styles?.fontWeight || 'normal',
      boxShadow: block.styles?.boxShadow || 'none'
    };
    return styles;
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'header':
        return (
          <div className="text-center">
            <h1 style={{ fontSize: block.styles?.titleSize || '28px', fontWeight: 'bold', color: block.styles?.titleColor || '#3b82f6' }}>
              {block.content?.title || 'BULLETIN SCOLAIRE'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {block.content?.subtitle || 'Année Scolaire 2024-2025'}
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              {block.content?.etablissement || 'Établissement'}
            </p>
          </div>
        );

      case 'text':
        return (
          <div style={getBlockStyles()}>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              {block.content || 'Double-cliquez pour modifier ce texte'}
            </p>
          </div>
        );

      case 'table':
        const matieres = block.content?.matieres || [
          { nom: 'Mathématiques', note: 15, coef: 4, appreciation: 'Très bien' },
          { nom: 'Français', note: 14, coef: 3, appreciation: 'Bien' },
        ];
        return (
          <div style={getBlockStyles()}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: block.styles?.headerBg || '#f3f4f6' }}>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Matière</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Note</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Coef</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {matieres.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{m.nom}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      <span style={{ color: m.note >= 14 ? '#10b981' : m.note >= 10 ? '#f59e0b' : '#ef4444' }}>
                        {m.note}/20
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">{m.coef}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{m.appreciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        const data = block.content?.data || [12, 14, 16, 13, 15];
        const labels = block.content?.labels || ['Maths', 'Français', 'Anglais', 'SVT', 'HG'];
        const maxVal = Math.max(...data);
        const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        return (
          <div style={getBlockStyles()}>
            <div className="flex items-end justify-around h-40" style={{ gap: '8px' }}>
              {data.map((val, i) => {
                const height = (val / 20) * 140;
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full max-w-[40px] rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(height, 5)}px`,
                        background: chartColors[i % chartColors.length]
                      }}
                    />
                    <span className="text-xs font-medium mt-1">{val}</span>
                    <span className="text-[10px] text-gray-500 truncate max-w-full">{labels[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'stats':
        const stats = block.content || { moyenne: 14.5, rang: 2, total: 25, mention: 'Très Bien' };
        return (
          <div className="grid grid-cols-4 gap-3" style={getBlockStyles()}>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <p className="text-xs text-gray-500">Moyenne</p>
              <p className="text-xl font-bold text-primary">{stats.moyenne}/20</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <p className="text-xs text-gray-500">Rang</p>
              <p className="text-xl font-bold text-primary">#{stats.rang}</p>
              <p className="text-[10px] text-gray-400">sur {stats.total}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <p className="text-xs text-gray-500">Mention</p>
              <p className="text-sm font-bold text-yellow-600">{stats.mention}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <p className="text-xs text-gray-500">Matières</p>
              <p className="text-xl font-bold text-primary">{block.content?.matieresCount || 0}</p>
            </div>
          </div>
        );

      case 'appreciation':
        return (
          <div style={getBlockStyles()}>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-primary mb-2">💬 Appréciation Générale</p>
              <p className="text-gray-700">{block.content || 'Excellent travail !'}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                ⭐ {block.content?.mention || 'Très Bien'}
              </div>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div style={getBlockStyles()}>
            <div className="border-t border-gray-300 pt-3 flex justify-between text-xs text-gray-500">
              <span>{block.content?.left || 'Document généré par ERP Scolaire'}</span>
              <span>{block.content?.center || new Date().toLocaleDateString('fr-FR')}</span>
              <span>{block.content?.right || 'Signature: _______________'}</span>
            </div>
          </div>
        );

      case 'divider':
        return (
          <hr style={{
            border: 'none',
            height: block.styles?.height || '2px',
            background: block.styles?.color || '#e5e7eb',
            margin: block.styles?.margin || '16px 0'
          }} />
        );

      default:
        return <div>Bloc inconnu</div>;
    }
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onClick={() => onSelect(block.id)}
      style={{ 
        cursor: 'move',
        transition: 'all 0.2s',
        ...getBlockStyles()
      }}
    >
      {/* Barre d'outils du bloc */}
      <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-base-100 rounded-lg shadow-lg p-1 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onMove(block.id, 'up'); }}
          className="btn btn-ghost btn-xs"
          title="Déplacer vers le haut"
        >
          ↑
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMove(block.id, 'down'); }}
          className="btn btn-ghost btn-xs"
          title="Déplacer vers le bas"
        >
          ↓
        </button>
        <div className="w-px h-4 bg-base-300"></div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
          className="btn btn-ghost btn-xs"
          title="Modifier"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          className="btn btn-ghost btn-xs text-error"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <div className="w-px h-4 bg-base-300"></div>
        <button
          onClick={(e) => { e.stopPropagation(); /* Ouvrir panneau de style */ }}
          className="btn btn-ghost btn-xs"
          title="Style"
        >
          <PaintBucket className="w-3 h-3" />
        </button>
      </div>

      {/* Contenu du bloc */}
      <div className="w-full">
        {renderBlockContent()}
      </div>

      {/* Éditeur inline (si en mode édition) */}
      {isEditing && (
        <div className="absolute inset-0 bg-white/95 p-4 rounded-lg shadow-2xl z-20 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm">Modifier le bloc</h4>
            <button onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {block.type === 'text' && (
            <textarea
              className="textarea textarea-bordered w-full h-32"
              value={localContent || ''}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={() => onUpdate(block.id, { content: localContent })}
            />
          )}
          
          {block.type === 'header' && (
            <div className="space-y-2">
              <input
                type="text"
                className="input input-bordered w-full input-sm"
                placeholder="Titre"
                value={block.content?.title || ''}
                onChange={(e) => onUpdate(block.id, { 
                  content: { ...block.content, title: e.target.value } 
                })}
              />
              <input
                type="text"
                className="input input-bordered w-full input-sm"
                placeholder="Sous-titre"
                value={block.content?.subtitle || ''}
                onChange={(e) => onUpdate(block.id, { 
                  content: { ...block.content, subtitle: e.target.value } 
                })}
              />
              <input
                type="text"
                className="input input-bordered w-full input-sm"
                placeholder="Établissement"
                value={block.content?.etablissement || ''}
                onChange={(e) => onUpdate(block.id, { 
                  content: { ...block.content, etablissement: e.target.value } 
                })}
              />
            </div>
          )}
          
          {block.type === 'appreciation' && (
            <textarea
              className="textarea textarea-bordered w-full h-24"
              placeholder="Appréciation"
              value={block.content || ''}
              onChange={(e) => onUpdate(block.id, { content: e.target.value })}
            />
          )}

          {/* Style options */}
          <div className="mt-3 pt-3 border-t border-base-200">
            <h5 className="text-xs font-semibold mb-2">Style</h5>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px]">Couleur</label>
                <input
                  type="color"
                  className="w-full h-8 rounded cursor-pointer"
                  value={block.styles?.color || '#000000'}
                  onChange={(e) => onUpdate(block.id, { 
                    styles: { ...block.styles, color: e.target.value } 
                  })}
                />
              </div>
              <div>
                <label className="text-[10px]">Fond</label>
                <input
                  type="color"
                  className="w-full h-8 rounded cursor-pointer"
                  value={block.styles?.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate(block.id, { 
                    styles: { ...block.styles, backgroundColor: e.target.value } 
                  })}
                />
              </div>
              <div>
                <label className="text-[10px]">Taille texte</label>
                <select
                  className="select select-bordered w-full select-xs"
                  value={block.styles?.fontSize || '14px'}
                  onChange={(e) => onUpdate(block.id, { 
                    styles: { ...block.styles, fontSize: e.target.value } 
                  })}
                >
                  <option value="12px">12px</option>
                  <option value="14px">14px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                  <option value="20px">20px</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL - ÉDITEUR
// ============================================================

function EditeurBulletins() {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // ============================================================
  // ÉTAT - LISTE DES BLOCS
  // ============================================================
  const [blocks, setBlocks] = useState([
    {
      id: 'header-1',
      type: 'header',
      content: {
        title: 'BULLETIN SCOLAIRE',
        subtitle: 'Année Scolaire 2024-2025',
        etablissement: 'Lycée Moderne'
      },
      styles: {
        padding: '20px',
        backgroundColor: 'transparent'
      }
    },
    {
      id: 'text-1',
      type: 'text',
      content: 'Informations de l\'élève : Jean Dupont - 6ème A',
      styles: {
        fontSize: '14px',
        color: '#374151',
        textAlign: 'center'
      }
    },
    {
      id: 'table-1',
      type: 'table',
      content: {
        matieres: [
          { nom: 'Mathématiques', note: 15, coef: 4, appreciation: 'Très bien' },
          { nom: 'Français', note: 14, coef: 3, appreciation: 'Bien' },
          { nom: 'Anglais', note: 16, coef: 2, appreciation: 'Excellent' },
          { nom: 'SVT', note: 13, coef: 3, appreciation: 'Bien' },
        ]
      },
      styles: {
        padding: '10px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }
    },
    {
      id: 'chart-1',
      type: 'chart',
      content: {
        data: [15, 14, 16, 13, 12],
        labels: ['Maths', 'Français', 'Anglais', 'SVT', 'HG']
      },
      styles: {
        padding: '15px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }
    },
    {
      id: 'stats-1',
      type: 'stats',
      content: {
        moyenne: 14.5,
        rang: 2,
        total: 25,
        mention: 'Très Bien',
        matieresCount: 4
      },
      styles: {
        padding: '10px'
      }
    },
    {
      id: 'appreciation-1',
      type: 'appreciation',
      content: 'Excellent travail tout au long du trimestre. Félicitations !',
      styles: {
        padding: '10px'
      }
    },
    {
      id: 'footer-1',
      type: 'footer',
      content: {
        left: 'Document généré par ERP Scolaire',
        center: new Date().toLocaleDateString('fr-FR'),
        right: 'Signature: _______________'
      },
      styles: {
        padding: '10px',
        marginTop: '10px'
      }
    }
  ]);

  // ============================================================
  // FONCTIONS DE GESTION DES BLOCS
  // ============================================================

  // Ajouter un bloc
  const ajouterBloc = (type) => {
    const newBlock = {
      id: `${type}-${Date.now()}`,
      type: type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    };
    setBlocks([...blocks, newBlock]);
    setSaveStatus({
      type: 'success',
      message: `Bloc "${type}" ajouté !`
    });
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000);
  };

  // Contenu par défaut selon le type
  const getDefaultContent = (type) => {
    switch(type) {
      case 'text': return 'Double-cliquez pour modifier ce texte';
      case 'header': return { title: 'Titre', subtitle: 'Sous-titre', etablissement: 'Établissement' };
      case 'table': return { matieres: [{ nom: 'Matière', note: 10, coef: 1, appreciation: '' }] };
      case 'chart': return { data: [10, 12, 14, 11, 13], labels: ['A', 'B', 'C', 'D', 'E'] };
      case 'stats': return { moyenne: 10, rang: 1, total: 1, mention: 'Passable', matieresCount: 0 };
      case 'appreciation': return 'Appréciation générale...';
      case 'footer': return { left: 'Gauche', center: 'Centre', right: 'Droite' };
      case 'divider': return {};
      default: return {};
    }
  };

  // Styles par défaut
  const getDefaultStyles = (type) => {
    const base = { padding: '12px', margin: '4px 0' };
    switch(type) {
      case 'header': return { ...base, backgroundColor: 'transparent', textAlign: 'center' };
      case 'table': return { ...base, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' };
      case 'chart': return { ...base, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' };
      case 'stats': return { ...base, backgroundColor: 'transparent' };
      case 'appreciation': return { ...base, backgroundColor: 'transparent' };
      case 'footer': return { ...base, backgroundColor: 'transparent' };
      case 'divider': return { margin: '16px 0', height: '2px', color: '#e5e7eb' };
      default: return base;
    }
  };

  // Supprimer un bloc
  const supprimerBloc = (id) => {
    if (blocks.length <= 1) {
      setSaveStatus({
        type: 'error',
        message: 'Vous devez garder au moins un bloc'
      });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000);
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  // Mettre à jour un bloc
  const mettreAJourBloc = (id, updates) => {
    setBlocks(blocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  // Déplacer un bloc
  const deplacerBloc = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  // ============================================================
  // EXPORT PDF
  // ============================================================
  const exporterPDF = async () => {
    if (!previewRef.current) return;
    
    setLoading(true);
    setSaveStatus({ type: 'info', message: 'Génération du PDF...' });

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('bulletin-personnalise.pdf');
      
      setSaveStatus({
        type: 'success',
        message: 'PDF exporté avec succès !'
      });
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: 'Erreur: ' + error.message
      });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
    }
  };

  // ============================================================
  // RENDU DES BLOCS DISPONIBLES (palette)
  // ============================================================
  const blockPalette = [
    { type: 'header', label: 'En-tête', icon: Layout, color: 'text-blue-500' },
    { type: 'text', label: 'Texte', icon: Type, color: 'text-gray-500' },
    { type: 'table', label: 'Tableau', icon: Table, color: 'text-green-500' },
    { type: 'chart', label: 'Graphique', icon: BarChart3, color: 'text-purple-500' },
    { type: 'stats', label: 'Statistiques', icon: TrendingUp, color: 'text-orange-500' },
    { type: 'appreciation', label: 'Appréciation', icon: Star, color: 'text-yellow-500' },
    { type: 'footer', label: 'Pied de page', icon: FileText, color: 'text-gray-500' },
    { type: 'divider', label: 'Séparateur', icon: Minus, color: 'text-gray-400' },
  ];

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-base-200">
      {/* En-tête */}
      <div className="bg-base-100 border-b border-primary/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold">Éditeur de Bulletins</h1>
            <span className="badge badge-primary badge-sm">Design Libre</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exporterPDF}
              disabled={loading}
              className="btn btn-primary btn-sm gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exporter PDF
            </button>
            <button className="btn btn-ghost btn-sm gap-1">
              <Undo className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost btn-sm gap-1">
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {saveStatus.message && (
        <div className={`max-w-7xl mx-auto px-4 mt-4 alert ${saveStatus.type === 'success' ? 'alert-success' : saveStatus.type === 'error' ? 'alert-error' : 'alert-info'} shadow-lg`}>
          <div>
            {saveStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{saveStatus.message}</span>
          </div>
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => setSaveStatus({ type: '', message: '' })}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Palette des blocs (gauche) */}
          <div className="lg:col-span-1">
            <div className="bg-base-100 rounded-xl shadow-lg border border-primary/10 p-4 sticky top-20">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Grid className="w-4 h-4 text-primary" />
                Ajouter des blocs
              </h3>
              <p className="text-xs text-base-content/40 mb-3">Cliquez pour ajouter un élément</p>
              <div className="grid grid-cols-2 gap-2">
                {blockPalette.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => ajouterBloc(item.type)}
                      className="p-3 bg-base-200 rounded-lg hover:bg-primary/10 transition-all hover:scale-105 text-center group"
                    >
                      <Icon className={`w-5 h-5 mx-auto ${item.color}`} />
                      <span className="text-xs block mt-1 text-base-content/70">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-base-200">
                <h4 className="text-xs font-semibold text-base-content/60 mb-2">💡 Astuces</h4>
                <ul className="text-[10px] text-base-content/40 space-y-1">
                  <li>• Survolez un bloc pour le modifier/supprimer</li>
                  <li>• Glissez-déposez pour réorganiser</li>
                  <li>• Double-cliquez pour éditer le texte</li>
                  <li>• Utilisez les flèches pour déplacer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Zone d'édition + Aperçu */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-base-100 rounded-xl shadow-lg border border-primary/10 overflow-hidden">
              <div className="p-3 border-b border-base-200 bg-base-200/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Aperçu - {blocks.length} blocs
                </h3>
                <div className="flex items-center gap-1">
                  <button className="btn btn-ghost btn-xs" title="Zoom avant">
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button className="btn btn-ghost btn-xs" title="Zoom arrière">
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-base-content/40">100%</span>
                </div>
              </div>
              
              <div 
                ref={previewRef}
                className="p-4 bg-white overflow-auto max-h-[800px]"
                style={{ minHeight: '500px' }}
              >
                <div className="max-w-4xl mx-auto space-y-2">
                  {blocks.map((block) => (
                    <EditableBlock
                      key={block.id}
                      block={block}
                      onUpdate={mettreAJourBloc}
                      onDelete={supprimerBloc}
                      onMove={deplacerBloc}
                      isSelected={selectedBlock === block.id}
                      onSelect={setSelectedBlock}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Indicateur de blocs */}
            <div className="flex flex-wrap gap-2">
              {blocks.map((block, index) => (
                <button
                  key={block.id}
                  onClick={() => {
                    const el = document.getElementById(`block-${block.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`badge gap-1 px-3 py-2 ${
                    selectedBlock === block.id ? 'badge-primary' : 'badge-ghost'
                  }`}
                >
                  <span className="text-xs">{index + 1}</span>
                  <span className="text-[10px]">{block.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styles pour le drag & drop visuel */}
      <style jsx>{`
        .dragging {
          opacity: 0.5;
          transform: scale(0.95);
        }
        .drag-over {
          border: 2px dashed #3b82f6;
          background: #eff6ff;
        }
      `}</style>
    </div>
  );
}

export default EditeurBulletins;