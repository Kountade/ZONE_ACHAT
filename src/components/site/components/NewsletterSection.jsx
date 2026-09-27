// src/components/site/NewsletterSection.jsx
import React from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';

const NewsletterSection = () => {
  return (
    <section className="py-16 bg-base-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Newsletter</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Restez informés</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Recevez nos actualités, événements et conseils directement dans votre boîte mail.
            </p>
          </div>

          {/* Formulaire */}
          <div className="card bg-base-100 shadow-xl p-6 md:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Ici vous connecterez la logique d'inscription (API, Mailchimp, etc.)
                alert('Inscription réussie (à connecter)');
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="input input-bordered w-full focus:input-primary"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary gap-2 sm:w-auto">
                <Send className="w-4 h-4" />
                S'abonner
              </button>
            </form>

            {/* Message de confidentialité */}
            <div className="mt-4 flex items-start gap-2 text-xs text-base-content/50">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                En vous abonnant, vous acceptez de recevoir nos communications.
                Vos données sont sécurisées et vous pouvez vous désinscrire à tout moment.
              </span>
            </div>
          </div>

          {/* Bonus : un petit indicateur de confiance */}
          <div className="mt-6 text-center text-sm text-base-content/40 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-primary" />
              Pas de spam
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-primary" />
              Désinscription facile
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-primary" />
              Contenu exclusif
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;