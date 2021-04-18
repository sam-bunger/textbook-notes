import React from 'react';
import styled from 'styled-components';

import Head from '../components/Head';
import { Navigation } from '../components/Landing/Navigation';
import { Features } from '../components/Landing/Features';
import { Hero } from '../components/Landing/Hero';

const Landing = () => {
  return (
    <Content>
      <Head title="Musation" description="Add notes to textbook PDFs" />
      <Navigation />
      <Hero />
      <Features />
    </Content>
  );
};

const Content = styled.div`
  overflow-x: hidden;
`;

export default Landing;
