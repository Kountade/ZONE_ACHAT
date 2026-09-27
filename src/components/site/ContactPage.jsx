// src/components/site/ContactPage.jsx
import React from 'react';
import PublicLayout from './Layout/PublicLayout';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';

const ContactPage = () => {
  const contactMethods = [
    { icon: Mail, label: 'Email', value: 'contact@ecole-excellence.fr', link: 'mailto:contact@ecole-excellence.fr' },
    { icon: Phone, label: 'Téléphone', value: '+33 1 23 45 67 89', link: 'tel:+33123456789' },
    { icon: MapPin, label: 'Adresse', value: '12 Rue de l’Éducation, 75000 Paris', link: 'https://maps.google.com' },
    { icon: Clock, label: 'Horaires d’ouverture', value: 'Lun–Ven : 8h00 – 18h00' },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-base-200 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">Contactez‑nous</h1>
          <p className="text-center text-base-content/60 mb-8">
            Nous sommes là pour répondre à toutes vos questions
          </p>

          {/* Coordonnées - grille sur 4 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {contactMethods.map((item, index) => {
              const Icon = item.icon;
              const content = item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {item.value}
                </a>
              ) : (
                <span>{item.value}</span>
              );
              return (
                <div
                  key={index}
                  className="card bg-base-100 shadow-lg p-4 text-center hover:shadow-xl transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <div className="text-sm text-base-content/70 mt-1">{content}</div>
                </div>
              );
            })}
          </div>

          {/* Formulaire */}
          <div className="card bg-base-100 shadow-xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">Envoyez‑nous un message</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Formulaire soumis (à connecter)');
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nom complet</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.fr"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Sujet</span>
                </label>
                <input
                  type="text"
                  placeholder="Sujet de votre message"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  placeholder="Écrivez votre message ici..."
                  required
                ></textarea>
              </div>
              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </button>
              </div>
            </form>
          </div>

          {/* Carte */}
          <div className="mt-8 card bg-base-100 shadow-xl p-4">
            <h2 className="text-xl font-bold mb-2">Nous trouver</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                title="map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85837307928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1612368000000!5m2!1sfr!2sfr"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ContactPage;