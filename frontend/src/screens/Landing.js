import React from 'react';
import HeroSection from '../screens/Landingpage/components/HeroSection';
import PainPoints from '../screens/Landingpage/components/PainPoints';
import ModulesGrid from '../screens/Landingpage/components/ModulesGrd';
import BenefitsStats from '../screens/Landingpage/components/BenefitsStats';
import Testimonial from '../screens/Landingpage/components/Testimonial';
import TechSecurity from '../screens/Landingpage/components/TechSecurity';
import FinalCTA from '../screens/Landingpage/components/FinalCTA';

const LandingPage = () => {
  return (
    <main>
      <HeroSection />
      <PainPoints />
      <ModulesGrid />
      <BenefitsStats />
      <Testimonial />
      <TechSecurity />
      <FinalCTA />
    </main>
  );
};

export default LandingPage;
