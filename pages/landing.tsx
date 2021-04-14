import React, { useEffect, useState } from 'react';

import data from '../data/data.json';
import Head from '../components/Head';
import { About } from '../components/Landing/About';
import { Testimonials } from '../components/Landing/Testimonials';
import { Contact } from '../components/Landing/Contact';
import { Services } from '../components/Landing/Services';
import { Gallery } from '../components/Landing/Gallery';
import { Navigation } from '../components/Landing/Navigation';
import { Features } from '../components/Landing/Features';

export type LandingState = {
  Header: {
    title: string;
    paragraph: string;
  };
  About: {
    paragraph: string;
    Why: string[];
    Why2: string[];
  };
  Services: {
    icon: string;
    name: string;
    text: string;
  }[];
  Testimonials: {
    img: string;
    text: string;
    name: string;
  }[];
  Contact: {
    address: string;
    phone: string;
    email: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  Features: {
    icon: string;
    title: string;
    text: string;
  }[];
};

const Landing = () => {
  const [landingPageData, setLandingPageData] = useState<Partial<LandingState>>({});
  useEffect(() => {
    setLandingPageData(data);
  }, []);

  return (
    <div>
      <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
      <Navigation />
      <Features data={landingPageData.Features} />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery />
      <Testimonials data={landingPageData.Testimonials} />
      <Contact data={landingPageData.Contact} />
    </div>
  );
};

export default Landing;
