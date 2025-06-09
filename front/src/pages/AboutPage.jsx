import React from 'react';
import AboutHero from '../components/About/AboutHero';
import AboutMatter from '../components/About/AboutMatter';
import AboutWhoWeAre from '../components/About/AboutWhoWeAre';
import AboutMission from '../components/About/AboutMission';
import AboutHelp from '../components/About/AboutHelp';
import AboutProtection from '../components/About/AboutProtection';
import Testimonial from '../components/HomePage/Testimonial';
import AboutJoin from '../components/About/AboutJoin';
import AboutSecure from '../components/About/AboutSecure';

const AboutPage = () => {
  return (
    <>
    <AboutHero />
    <AboutMatter/>
    <AboutWhoWeAre />
    <AboutMission />
    <AboutHelp />
    <AboutProtection />
    <AboutSecure />
    <Testimonial/>
    <AboutJoin />
      </>
  );
};

export default AboutPage;