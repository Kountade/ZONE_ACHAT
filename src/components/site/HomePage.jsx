// src/components/site/HomePage.jsx
import React from 'react';
import PublicLayout from './Layout/PublicLayout';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import StatsSection from './components/StatsSection';
import Testimonials from './components/Testimonials';
import PartnersSection from './components/PartnersSection';
import NewsletterSection from './components/NewsletterSection';

const HomePage = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <Testimonials />
      <PartnersSection />
      <NewsletterSection />
    </PublicLayout>
  );
};

export default HomePage;