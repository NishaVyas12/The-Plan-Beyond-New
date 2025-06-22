import React from 'react';
import Sidebar from '../components/Dashboard/Dash/sidebar';
import Navbar from '../components/Dashboard/Dash/navbar';
import Nominee from '../components/Dashboard/Nominee/Nominee';

const NomineePage = () => {
  return (
    <>
      <Sidebar />
      <Navbar />
      <Nominee />
      </>
  );
};

export default NomineePage;