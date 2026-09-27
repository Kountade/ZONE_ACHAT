// src/components/site/TeamPage.jsx

import React, { useState } from 'react';
import PublicLayout from './Layout/PublicLayout';
import { 
  Users, 
  Mail, 
  Phone, 
  GraduationCap,
  BookOpen,
  Award,
  ChevronRight,
  User,
  Clock
} from 'lucide-react';

const TeamPage = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('Tous');

  // ============================================================
  // ÉQUIPE DU GROUPE SCOLAIRE AVEC PHOTOS RÉELLES
  // ============================================================
  const members = [
    {
      id: 1,
      nom: "Dr. Jean-Pierre Martin",
      fonction: "Directeur Général",
      departement: "Direction",
      email: "jp.martin@groupe-scolaire.fr",
      telephone: "+221 77 123 45 67",
      photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
      description: "Docteur en Sciences de l'Éducation avec plus de 25 ans d'expérience dans le système éducatif. Passionné par l'innovation pédagogique et la réussite des élèves.",
      competences: ["Leadership éducatif", "Gestion d'établissement", "Innovation pédagogique"],
      ordre: 1,
      est_actif: true,
      experience: 25
    },
    {
      id: 2,
      nom: "Mme. Sophie Diallo",
      fonction: "Directrice Pédagogique",
      departement: "Pédagogie",
      email: "s.diallo@groupe-scolaire.fr",
      telephone: "+221 77 234 56 78",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
      description: "Expert en curriculum et méthodes d'enseignement. Coordonne les programmes pédagogiques et assure la qualité de l'enseignement.",
      competences: ["Curriculum design", "Formation enseignants", "Évaluation pédagogique"],
      ordre: 2,
      est_actif: true,
      experience: 18
    },
    {
      id: 3,
      nom: "M. Cheikh Mbaye",
      fonction: "Responsable Administratif",
      departement: "Administration",
      email: "c.mbaye@groupe-scolaire.fr",
      telephone: "+221 77 345 67 89",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      description: "Spécialiste de la gestion administrative et financière des établissements scolaires. Optimise les processus et la gestion des ressources.",
      competences: ["Gestion administrative", "Comptabilité", "RH"],
      ordre: 3,
      est_actif: true,
      experience: 15
    },
    {
      id: 4,
      nom: "Mme. Fatou Ndiaye",
      fonction: "Responsable Vie Scolaire",
      departement: "Vie Scolaire",
      email: "f.ndiaye@groupe-scolaire.fr",
      telephone: "+221 77 456 78 90",
      photo: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=400&fit=crop&crop=face",
      description: "Psychologue scolaire et médiatrice. Assure le bien-être des élèves et la cohésion au sein de l'établissement.",
      competences: ["Psychologie scolaire", "Médiation", "Gestion de conflits"],
      ordre: 4,
      est_actif: true,
      experience: 12
    },
    {
      id: 5,
      nom: "M. Ibrahima Sow",
      fonction: "Coordinateur des Programmes",
      departement: "Programmes",
      email: "i.sow@groupe-scolaire.fr",
      telephone: "+221 77 567 89 01",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      description: "Ingénieur pédagogique et coordinateur des programmes. Supervise la mise en œuvre des parcours éducatifs.",
      competences: ["Ingénierie pédagogique", "Coordination", "Évaluation"],
      ordre: 5,
      est_actif: true,
      experience: 10
    },
    {
      id: 6,
      nom: "Mme. Aïssatou Ba",
      fonction: "Responsable Communication",
      departement: "Communication",
      email: "a.ba@groupe-scolaire.fr",
      telephone: "+221 77 678 90 12",
      photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
      description: "Stratège en communication institutionnelle. Gère les relations publiques et la communication interne.",
      competences: ["Communication", "Relations publiques", "Marketing"],
      ordre: 6,
      est_actif: true,
      experience: 8
    }
  ];

  // ============================================================
  // FILTRAGE PAR DÉPARTEMENT
  // ============================================================
  const departments = ['Tous', ...new Set(members.map(m => m.departement).filter(Boolean))];

  const filteredMembers = members.filter(member => {
    if (!member || !member.est_actif) return false;
    const matchesDepartment = selectedDepartment === 'Tous' || member.departement === selectedDepartment;
    return matchesDepartment;
  });

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <PublicLayout>
      <div className="min-h-screen bg-base-200">

        {/* ===== HERO ===== */}
        <div
          className="relative h-[40vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80")',
            backgroundColor: '#1a1a2e'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/10">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Notre Équipe</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Équipe Pédagogique</h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">
              Des professionnels dévoués à l'excellence éducative
            </p>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="max-w-7xl mx-auto px-4 py-12">

          {/* ===== FILTRES ===== */}
          <div className="flex flex-wrap gap-2 mb-8">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`btn btn-sm ${selectedDepartment === dept ? 'btn-primary' : 'btn-ghost'}`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* ===== GRID MEMBRES AVEC GRANDES IMAGES ===== */}
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  {/* IMAGE GRAND FORMAT */}
                  <div className="relative h-64 w-full overflow-hidden bg-base-300">
                    {member.photo ? (
                      <img 
                        src={member.photo} 
                        alt={member.nom}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nom)}&size=300&background=random&color=fff`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-base-content/30" />
                      </div>
                    )}
                    
                    {/* BADGE DÉPARTEMENT SUR L'IMAGE */}
                    {member.departement && (
                      <div className="absolute bottom-3 left-3">
                        <span className="badge badge-primary badge-lg shadow-lg">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {member.departement}
                        </span>
                      </div>
                    )}
                    
                    {/* BADGE EXPÉRIENCE SUR L'IMAGE */}
                    <div className="absolute top-3 right-3">
                      <span className="badge badge-accent badge-lg shadow-lg">
                        <Clock className="w-3 h-3 mr-1" />
                        {member.experience}+ ans
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-6">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{member.nom}</h3>
                      <p className="text-sm text-primary font-medium">{member.fonction}</p>
                    </div>

                    {member.description && (
                      <p className="text-sm text-base-content/60 mt-2 line-clamp-2 text-center">
                        {member.description}
                      </p>
                    )}

                    {member.competences && member.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 justify-center">
                        {member.competences.slice(0, 3).map((comp, idx) => (
                          <span key={idx} className="badge badge-primary badge-sm badge-outline">
                            {comp}
                          </span>
                        ))}
                        {member.competences.length > 3 && (
                          <span className="badge badge-ghost badge-sm">+{member.competences.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-base-200">
                      <div className="flex items-center gap-3 text-xs text-base-content/40">
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`}
                            className="hover:text-primary transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {member.telephone && (
                          <a 
                            href={`tel:${member.telephone}`}
                            className="hover:text-primary transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <button 
                        className="btn btn-primary btn-sm gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member);
                        }}
                      >
                        Voir le profil
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-base-content/30 mx-auto" />
              <h3 className="text-xl font-bold mt-4">Aucun membre trouvé</h3>
              <p className="text-base-content/50">Aucun membre dans ce département</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL DÉTAILS AVEC GRANDE IMAGE ===== */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-base-100 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 btn btn-circle btn-ghost btn-sm bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedMember(null)}
            >
              <span className="text-xl">✕</span>
            </button>

            {/* GRANDE IMAGE DANS LA MODAL */}
            <div className="relative h-80 w-full overflow-hidden">
              {selectedMember.photo ? (
                <img 
                  src={selectedMember.photo} 
                  alt={selectedMember.nom}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.nom)}&size=300&background=random&color=fff`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-base-300 flex items-center justify-center">
                  <User className="w-24 h-24 text-base-content/30" />
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold">{selectedMember.nom}</h3>
                <p className="text-xl text-primary">{selectedMember.fonction}</p>
                {selectedMember.departement && (
                  <span className="badge badge-ghost mt-2">
                    {selectedMember.departement}
                  </span>
                )}
              </div>

              {selectedMember.description && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-lg">À propos</h4>
                  <p className="text-base-content/70 leading-relaxed">{selectedMember.description}</p>
                </div>
              )}

              {selectedMember.competences && selectedMember.competences.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-lg">Compétences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.competences.map((comp, idx) => (
                      <span key={idx} className="badge badge-primary badge-lg">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-base-200">
                <h4 className="font-semibold mb-3 text-lg">Contact</h4>
                <div className="space-y-2">
                  {selectedMember.email && (
                    <a 
                      href={`mailto:${selectedMember.email}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{selectedMember.email}</span>
                    </a>
                  )}
                  {selectedMember.telephone && (
                    <a 
                      href={`tel:${selectedMember.telephone}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{selectedMember.telephone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default TeamPage;