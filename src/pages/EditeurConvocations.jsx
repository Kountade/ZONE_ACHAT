// src/pages/EditeurConvocations.jsx
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
  Brush, Eraser, Undo, Redo, ZoomIn, ZoomOut,
  Bell, Mail, Phone, MapPin, UserCheck, Calendar as CalendarIcon,
  Clock as ClockIcon, Users as UsersIcon, FileCheck,
  Send as SendIcon, Paperclip, Tag, Flag, AlertTriangle,
  Building2, Briefcase, ClipboardList, FileSignature,
  UserPlus, UserMinus, CalendarRange, Timer, BadgeCheck,
  Megaphone, BellRing, MessageCircle, Share2, Bookmark
} from 'lucide-react';

// ============================================================
// COMPOSANT BLOC INDIVIDUEL
// ============================================================

const EditableBlock = ({ block, onUpdate, onDelete, onMove, isSelected, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);

  const getBlockStyles = () => ({
    padding: block.styles?.padding || '16px',
    margin: block.styles?.margin || '0px',
    backgroundColor: block.styles?.backgroundColor || 'transparent',
    color: block.styles?.color || '#111827',
    borderRadius: block.styles?.borderRadius || '0px',
    border: block.styles?.border || 'none',
    textAlign: block.styles?.textAlign || 'left',
    fontFamily: block.styles?.fontFamily || 'Arial, sans-serif',
    fontSize: block.styles?.fontSize || '14px',
    fontWeight: block.styles?.fontWeight || 'normal'
  });

  const renderBlockContent = () => {
    switch (block.type) {
      case 'header-convocation':
        return (
          <div className="text-center border-b-2 border-primary pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Bell className="w-10 h-10 text-primary" />
              <h1 style={{ fontSize: block.styles?.titleSize || '28px', fontWeight: 'bold', color: '#3b82f6' }}>
                {block.content?.title || 'CONVOCATION OFFICIELLE'}
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {block.content?.subtitle || 'Document à conserver'}
            </p>
            <div className="flex justify-center gap-6 mt-2 text-sm text-gray-500">
              <span>📅 {block.content?.date || new Date().toLocaleDateString('fr-FR')}</span>
              <span>📋 Réf: {block.content?.reference || 'CONV-2024-001'}</span>
            </div>
          </div>
        );

      case 'destinataire':
        return (
          <div style={getBlockStyles()} className="bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <UserCheck className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-blue-700">DESTINATAIRE</p>
                <p className="text-base font-bold">{block.content?.nom || 'Nom du destinataire'}</p>
                <p className="text-sm text-gray-600">{block.content?.fonction || 'Fonction'}</p>
                <p className="text-sm text-gray-500">{block.content?.classe || 'Classe / Service'}</p>
              </div>
            </div>
          </div>
        );

      case 'contenu':
        return (
          <div style={getBlockStyles()}>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {block.content || 'Contenu de la convocation...'}
              </p>
            </div>
          </div>
        );

      case 'details':
        const details = block.content || {};
        return (
          <div style={getBlockStyles()} className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium">{details.date || '--/--/----'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Heure</p>
                <p className="text-sm font-medium">{details.heure || '--:--'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Lieu</p>
                <p className="text-sm font-medium">{details.lieu || 'Lieu de la réunion'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2 col-span-2">
              <UsersIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Participants</p>
                <p className="text-sm font-medium">{details.participants || 'Liste des participants'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2 col-span-2">
              <Flag className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Objet</p>
                <p className="text-sm font-medium">{details.objet || 'Objet de la convocation'}</p>
              </div>
            </div>
          </div>
        );

      case 'ordre-jour':
        const points = block.content?.points || [
          'Point 1: Accueil et introduction',
          'Point 2: Présentation des résultats',
          'Point 3: Discussions et propositions'
        ];
        return (
          <div style={getBlockStyles()} className="bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Ordre du Jour
            </h4>
            <ul className="space-y-1">
              {points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'signature':
        return (
          <div style={getBlockStyles()} className="border-t-2 border-gray-300 pt-4 mt-2">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500">Fait à {block.content?.lieu || '.........'}</p>
                <p className="text-sm text-gray-500">Le {block.content?.date || '.........'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{block.content?.signataire || 'Le responsable'}</p>
                <p className="text-sm text-gray-500">Signature et cachet</p>
                <div className="mt-2 h-12 border-b-2 border-gray-300 w-full max-w-[150px] ml-auto"></div>
              </div>
            </div>
          </div>
        );

      case 'statut':
        return (
          <div style={getBlockStyles()}>
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{
              backgroundColor: block.content?.couleur || '#fef3c7',
              borderColor: block.content?.couleur || '#f59e0b'
            }}>
              {block.content?.statut === 'urgent' ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : block.content?.statut === 'important' ? (
                <Flag className="w-5 h-5 text-orange-500" />
              ) : (
                <BadgeCheck className="w-5 h-5 text-green-500" />
              )}
              <span className="font-medium">{block.content?.label || 'Statut: Normal'}</span>
            </div>
          </div>
        );

      default:
        return <div>Bloc inconnu</div>;
    }
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
      onClick={() => onSelect(block.id)}
      style={{ cursor: 'move', transition: 'all 0.2s' }}
    >
      {/* Barre d'outils */}
      <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-base-100 rounded-lg shadow-lg p-1 z-10">
        <button onClick={(e) => { e.stopPropagation(); onMove(block.id, 'up'); }} className="btn btn-ghost btn-xs" title="Déplacer vers le haut">↑</button>
        <button onClick={(e) => { e.stopPropagation(); onMove(block.id, 'down'); }} className="btn btn-ghost btn-xs" title="Déplacer vers le bas">↓</button>
        <div className="w-px h-4 bg-base-300"></div>
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }} className="btn btn-ghost btn-xs" title="Modifier">
          <Edit className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); }} className="btn btn-ghost btn-xs text-error" title="Supprimer">
          <Trash2 className="w-3 h-3" />
        </button>
        <div className="w-px h-4 bg-base-300"></div>
        <button onClick={(e) => { e.stopPropagation(); /* Ouvrir panneau style */ }} className="btn btn-ghost btn-xs" title="Style">
          <PaintBucket className="w-3 h-3" />
        </button>
      </div>

      {/* Contenu */}
      <div className="w-full">{renderBlockContent()}</div>

      {/* Éditeur inline */}
      {isEditing && (
        <div className="absolute inset-0 bg-white/95 p-4 rounded-lg shadow-2xl z-20 overflow-auto border-2 border-primary">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm">Modifier le bloc</h4>
            <button onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>

          {block.type === 'header-convocation' && (
            <div className="space-y-2">
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Titre"
                value={block.content?.title || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, title: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Sous-titre"
                value={block.content?.subtitle || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, subtitle: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Référence"
                value={block.content?.reference || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, reference: e.target.value } })}
              />
            </div>
          )}

          {block.type === 'destinataire' && (
            <div className="space-y-2">
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Nom"
                value={block.content?.nom || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, nom: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Fonction"
                value={block.content?.fonction || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, fonction: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Classe / Service"
                value={block.content?.classe || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, classe: e.target.value } })}
              />
            </div>
          )}

          {block.type === 'contenu' && (
            <textarea className="textarea textarea-bordered w-full h-32"
              value={block.content || ''}
              onChange={(e) => onUpdate(block.id, { content: e.target.value })}
            />
          )}

          {block.type === 'details' && (
            <div className="space-y-2">
              <input type="date" className="input input-bordered w-full input-sm"
                value={block.content?.date || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, date: e.target.value } })}
              />
              <input type="time" className="input input-bordered w-full input-sm"
                value={block.content?.heure || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, heure: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Lieu"
                value={block.content?.lieu || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, lieu: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Participants"
                value={block.content?.participants || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, participants: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Objet"
                value={block.content?.objet || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, objet: e.target.value } })}
              />
            </div>
          )}

          {block.type === 'ordre-jour' && (
            <div className="space-y-2">
              <textarea className="textarea textarea-bordered w-full h-32" placeholder="Points (un par ligne)"
                value={block.content?.points?.join('\n') || ''}
                onChange={(e) => onUpdate(block.id, { 
                  content: { ...block.content, points: e.target.value.split('\n').filter(p => p.trim()) } 
                })}
              />
              <p className="text-xs text-base-content/40">Un point par ligne</p>
            </div>
          )}

          {block.type === 'signature' && (
            <div className="space-y-2">
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Signataire"
                value={block.content?.signataire || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, signataire: e.target.value } })}
              />
              <input type="text" className="input input-bordered w-full input-sm" placeholder="Lieu"
                value={block.content?.lieu || ''}
                onChange={(e) => onUpdate(block.id, { content: { ...block.content, lieu: e.target.value } })}
              />
            </div>
          )}

          {block.type === 'statut' && (
            <div className="space-y-2">
              <select className="select select-bordered w-full"
                value={block.content?.statut || 'normal'}
                onChange={(e) => {
                  const statuts = {
                    urgent: { statut: 'urgent', label: '⚠️ URGENT', couleur: '#fef2f2' },
                    important: { statut: 'important', label: '📌 IMPORTANT', couleur: '#fffbeb' },
                    normal: { statut: 'normal', label: '✅ Normal', couleur: '#f0fdf4' }
                  };
                  onUpdate(block.id, { content: statuts[e.target.value] });
                }}
              >
                <option value="normal">✅ Normal</option>
                <option value="important">📌 Important</option>
                <option value="urgent">⚠️ Urgent</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function EditeurConvocations() {
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
      type: 'header-convocation',
      content: {
        title: 'CONVOCATION OFFICIELLE',
        subtitle: 'Document à conserver',
        reference: 'CONV-2024-001',
        date: new Date().toLocaleDateString('fr-FR')
      },
      styles: { padding: '20px', backgroundColor: 'transparent' }
    },
    {
      id: 'statut-1',
      type: 'statut',
      content: { statut: 'normal', label: '✅ Normal', couleur: '#f0fdf4' },
      styles: { padding: '8px' }
    },
    {
      id: 'destinataire-1',
      type: 'destinataire',
      content: {
        nom: 'Jean Dupont',
        fonction: 'Professeur Principal',
        classe: '6ème A'
      },
      styles: { padding: '16px' }
    },
    {
      id: 'details-1',
      type: 'details',
      content: {
        date: '2024-12-15',
        heure: '14:00',
        lieu: 'Salle de réunion - Bâtiment A',
        participants: 'Tous les enseignants de 6ème',
        objet: 'Réunion pédagogique de fin de trimestre'
      },
      styles: { padding: '12px' }
    },
    {
      id: 'contenu-1',
      type: 'contenu',
      content: 'J\'ai l\'honneur de vous convier à la réunion pédagogique qui se tiendra le 15 décembre 2024 à 14h00 en salle de réunion. L\'ordre du jour est le suivant : bilan du premier trimestre, préparation du second trimestre, et diverses questions.',
      styles: { padding: '12px' }
    },
    {
      id: 'ordre-1',
      type: 'ordre-jour',
      content: {
        points: [
          'Accueil et introduction',
          'Bilan du 1er trimestre',
          'Préparation du 2ème trimestre',
          'Questions diverses'
        ]
      },
      styles: { padding: '12px' }
    },
    {
      id: 'signature-1',
      type: 'signature',
      content: {
        signataire: 'Le Chef d\'Établissement',
        lieu: 'Lycée Moderne',
        date: new Date().toLocaleDateString('fr-FR')
      },
      styles: { padding: '12px' }
    }
  ]);

  // ============================================================
  // FONCTIONS
  // ============================================================

  const ajouterBloc = (type) => {
    const newBlock = {
      id: `${type}-${Date.now()}`,
      type: type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    };
    setBlocks([...blocks, newBlock]);
    setSaveStatus({ type: 'success', message: `Bloc "${type}" ajouté !` });
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000);
  };

  const getDefaultContent = (type) => {
    switch(type) {
      case 'header-convocation': return { title: 'CONVOCATION', subtitle: 'Document officiel', reference: 'CONV-2024-001' };
      case 'destinataire': return { nom: 'Nom du destinataire', fonction: 'Fonction', classe: 'Classe' };
      case 'contenu': return 'Contenu de la convocation...';
      case 'details': return { date: '', heure: '', lieu: '', participants: '', objet: '' };
      case 'ordre-jour': return { points: ['Point 1', 'Point 2', 'Point 3'] };
      case 'signature': return { signataire: 'Le responsable', lieu: '', date: new Date().toLocaleDateString('fr-FR') };
      case 'statut': return { statut: 'normal', label: '✅ Normal', couleur: '#f0fdf4' };
      default: return {};
    }
  };

  const getDefaultStyles = (type) => {
    const base = { padding: '12px', margin: '4px 0' };
    switch(type) {
      case 'header-convocation': return { ...base, backgroundColor: 'transparent' };
      case 'destinataire': return { ...base, backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' };
      case 'contenu': return { ...base, backgroundColor: 'transparent' };
      case 'details': return { ...base, backgroundColor: 'transparent' };
      case 'ordre-jour': return { ...base, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' };
      case 'signature': return { ...base, backgroundColor: 'transparent' };
      case 'statut': return { ...base, padding: '8px' };
      default: return base;
    }
  };

  const supprimerBloc = (id) => {
    if (blocks.length <= 1) {
      setSaveStatus({ type: 'error', message: 'Vous devez garder au moins un bloc' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000);
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const mettreAJourBloc = (id, updates) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

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
      pdf.save('convocation-personnalisee.pdf');
      setSaveStatus({ type: 'success', message: 'PDF exporté avec succès !' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Erreur: ' + error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
    }
  };

  // ============================================================
  // PALETTE DES BLOCS
  // ============================================================
  const blockPalette = [
    { type: 'header-convocation', label: 'En-tête', icon: Bell, color: 'text-blue-500' },
    { type: 'statut', label: 'Statut', icon: Flag, color: 'text-orange-500' },
    { type: 'destinataire', label: 'Destinataire', icon: UserCheck, color: 'text-green-500' },
    { type: 'details', label: 'Détails', icon: CalendarIcon, color: 'text-purple-500' },
    { type: 'contenu', label: 'Contenu', icon: FileText, color: 'text-gray-500' },
    { type: 'ordre-jour', label: 'Ordre du Jour', icon: ClipboardList, color: 'text-indigo-500' },
    { type: 'signature', label: 'Signature', icon: FileSignature, color: 'text-red-500' },
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
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold">Éditeur de Convocations</h1>
            <span className="badge badge-primary badge-sm">Design Libre</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exporterPDF} disabled={loading} className="btn btn-primary btn-sm gap-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exporter PDF
            </button>
            <button className="btn btn-ghost btn-sm gap-1" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
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
          <button className="btn btn-sm btn-ghost" onClick={() => setSaveStatus({ type: '', message: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Palette */}
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
                  <li>• Utilisez les flèches pour réorganiser</li>
                  <li>• Double-cliquez pour éditer le texte</li>
                  <li>• Personnalisez les couleurs et styles</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-base-100 rounded-xl shadow-lg border border-primary/10 overflow-hidden">
              <div className="p-3 border-b border-base-200 bg-base-200/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Aperçu - {blocks.length} blocs
                </h3>
                <span className="text-xs text-base-content/40">
                  Convocation
                </span>
              </div>
              
              <div 
                ref={previewRef}
                className="p-6 bg-white overflow-auto max-h-[900px]"
                style={{ minHeight: '600px' }}
              >
                <div className="max-w-4xl mx-auto space-y-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditeurConvocations;