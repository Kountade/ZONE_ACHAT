// src/components/site/EventsPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Eye,
  Heart,
  Share2,
  Bell,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Award,
  UserCheck,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  Star,
  TrendingUp
} from 'lucide-react';

const EventsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [viewMode, setViewMode] = useState('grid');

  const categories = ['Tous', 'Conférences', 'Ateliers', 'Sports', 'Culturels', 'Sorties', 'Cérémonies'];

  const events = [
    {
      id: 1,
      title: 'Journée Portes Ouvertes 2024',
      description: 'Venez découvrir notre établissement, rencontrer notre équipe et visiter nos installations modernes.',
      date: '2024-10-20',
      time: '09:00 - 17:00',
      location: 'Campus Principal',
      category: 'Conférences',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80',
      participants: 150,
      maxParticipants: 200,
      status: 'upcoming',
      featured: true,
      organizer: 'Direction',
      email: 'contact@erpscolaire.com',
      phone: '+221 77 123 45 67'
    },
    {
      id: 2,
      title: 'Atelier de robotique éducative',
      description: 'Initiation à la robotique pour les élèves de 6ème à 3ème. Découvrez les bases de la programmation.',
      date: '2024-10-25',
      time: '14:00 - 17:00',
      location: 'Labo Technologie',
      category: 'Ateliers',
      image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80',
      participants: 45,
      maxParticipants: 60,
      status: 'upcoming',
      featured: false,
      organizer: 'M. Fall',
      email: 'robotique@erpscolaire.com',
      phone: '+221 77 123 45 67'
    },
    {
      id: 3,
      title: 'Tournoi de football inter-écoles',
      description: 'Tournoi annuel de football réunissant les établissements de la région.',
      date: '2024-11-05',
      time: '08:00 - 18:00',
      location: 'Stade Municipal',
      category: 'Sports',
      image: 'https://images.unsplash.com/photo-1574950572203-a6a6d9ef7b0f?w=600&q=80',
      participants: 120,
      maxParticipants: 150,
      status: 'upcoming',
      featured: true,
      organizer: 'Association Sportive',
      email: 'sport@erpscolaire.com',
      phone: '+221 77 123 45 67'
    },
    {
      id: 4,
      title: 'Exposition d\'arts plastiques',
      description: 'Exposition des œuvres des élèves de la section arts plastiques.',
      date: '2024-09-28',
      time: '10:00 - 18:00',
      location: 'Galerie de l\'école',
      category: 'Culturels',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
      participants: 80,
      maxParticipants: 100,
      status: 'ongoing',
      featured: false,
      organizer: 'Mme Ndiaye',
      email: 'arts@erpscolaire.com',
      phone: '+221 77 123 45 67'
    },
    {
      id: 5,
      title: 'Sortie pédagogique au Musée National',
      description: 'Visite guidée du Musée National pour les élèves de CM2.',
      date: '2024-09-20',
      time: '08:30 - 16:00',
      location: 'Musée National',
      category: 'Sorties',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=600&q=80',
      participants: 60,
      maxParticipants: 60,
      status: 'past',
      featured: false,
      organizer: 'M. Diallo',
      email: 'sorties@erpscolaire.com',
      phone: '+221 77 123 45 67'
    },
    {
      id: 6,
      title: 'Cérémonie de remise des diplômes',
      description: 'Cérémonie officielle de remise des diplômes aux élèves de terminale.',
      date: '2024-07-15',
      time: '15:00 - 19:00',
      location: 'Grand Amphithéâtre',
      category: 'Cérémonies',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80',
      participants: 200,
      maxParticipants: 300,
      status: 'past',
      featured: true,
      organizer: 'Direction',
      email: 'direction@erpscolaire.com',
      phone: '+221 77 123 45 67'
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { label: 'À venir', color: 'badge-primary', icon: Bell },
      ongoing: { label: 'En cours', color: 'badge-success', icon: ClockIcon },
      past: { label: 'Passé', color: 'badge-ghost', icon: CheckCircle }
    };
    const config = statusConfig[status] || statusConfig.upcoming;
    const Icon = config.icon;
    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const featuredEvents = filteredEvents.filter(e => e.featured);
  const regularEvents = filteredEvents.filter(e => !e.featured);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-base-200">
        
        {/* ===== HERO ===== */}
        <div className="relative h-[40vh] flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1574950572203-a6a6d9ef7b0f?w=1400&q=80")',
          backgroundColor: '#1a1a2e'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/10">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-medium">Événements</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Événements</h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">
              Tous les événements de l'établissement
            </p>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          
          {/* ===== SEARCH & FILTERS ===== */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ===== FEATURED EVENTS ===== */}
          {featuredEvents.length > 0 && searchTerm === '' && selectedCategory === 'Tous' && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Événements à la une
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredEvents.map((event) => (
                  <div key={event.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                    <figure className="relative h-56">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(event.status)}
                      </div>
                    </figure>
                    <div className="card-body">
                      <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      </div>
                      <h3 className="card-title text-xl">{event.title}</h3>
                      <p className="text-base-content/60 line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/50">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.participants}/{event.maxParticipants}
                        </span>
                      </div>
                      <div className="card-actions justify-end mt-2">
                        <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm gap-1">
                          Détails
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== EVENTS GRID ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
                <figure className="relative h-48">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <span className="badge badge-ghost badge-sm">{event.category}</span>
                  </div>
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(event.status)}
                  </div>
                </figure>
                <div className="card-body p-4">
                  <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </span>
                  </div>
                  <h3 className="card-title text-sm font-semibold line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-base-content/50 line-clamp-2">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/40">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.participants}/{event.maxParticipants}
                    </span>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <Link to={`/events/${event.id}`} className="btn btn-primary btn-xs gap-1">
                      Détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== NO RESULTS ===== */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold">Aucun événement trouvé</h3>
              <p className="text-base-content/50">Essayez de modifier votre recherche</p>
            </div>
          )}

          {/* ===== STATS ===== */}
          <div className="bg-base-100 rounded-xl p-6 mt-12 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{events.length}</div>
                <div className="text-sm text-base-content/50">Événements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {events.filter(e => e.status === 'upcoming').length}
                </div>
                <div className="text-sm text-base-content/50">À venir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {events.filter(e => e.status === 'ongoing').length}
                </div>
                <div className="text-sm text-base-content/50">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">
                  {events.reduce((acc, e) => acc + e.participants, 0)}
                </div>
                <div className="text-sm text-base-content/50">Participants</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default EventsPage;