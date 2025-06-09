import React from 'react';
import HeroSection from '../components/HomePage/HeroSection';
import Legacy from '../components/HomePage/Legacy';
import Choose from '../components/HomePage/Choose';
import Future from '../components/HomePage/Future';
import Process from '../components/HomePage/Process';
import RevealPrice from '../components/HomePage/RevealPrice';
import Feature from '../components/HomePage/Feature';
import Testimonial from '../components/HomePage/Testimonial';
import Faq from '../components/HomePage/Faq';
import TestimonialSection from '../components/HomePage/TestimonialSection';
import DivingSection from '../components/HomePage/DivingSection';
const HomePage = () => {
  return (
    <>
      <HeroSection />
      <TestimonialSection />
      <Legacy />
      <Choose />
      <Future />
      <Process />
      <RevealPrice />
      <Feature />
      <Testimonial />
      <DivingSection />
      <Faq />
      </>
  );
};

export default HomePage;