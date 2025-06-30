import React from 'react';
import Sidebar from '../components/Dashboard/Dash/sidebar';
import Navbar from '../components/Dashboard/Dash/navbar';
import FamilyInfo from '../components/Dashboard/FamilyId/FamilyInfo';


const FamilyIDPage = () => {
  return (
    <>
      <Sidebar />
      <Navbar />
     <FamilyInfo />
      </>
  );
};

export default FamilyIDPage;