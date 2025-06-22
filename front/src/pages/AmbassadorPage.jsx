import React from 'react';
import Sidebar from '../components/Dashboard/Dash/sidebar';
import Navbar from '../components/Dashboard/Dash/navbar';
import Ambassador from '../components/Dashboard/Nominee/Ambassador';

const AmbassadorPage = () => {
  return (
    <>
      <Sidebar />
      <Navbar />
      <Ambassador />
      </>
  );
};

export default AmbassadorPage;