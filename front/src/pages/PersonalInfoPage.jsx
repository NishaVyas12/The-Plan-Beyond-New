import React from 'react';
import Sidebar from '../components/Dashboard/Dash/sidebar';
import Navbar from '../components/Dashboard/Dash/navbar';
import PersonalInfo from '../components/Dashboard/PersonalId/PersonalInfo';



const PersonalInfoPage = () => {
  return (
    <>
      <Sidebar />
      <Navbar />
      <PersonalInfo />
      </>
  );
};

export default PersonalInfoPage;