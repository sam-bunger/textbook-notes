import React from 'react';
import styled from 'styled-components';

const Nice = styled.h1`
  font-family: 'Yellowtail', cursive;
`;

const Header = () => {
  return (
    <>
      <Nice>Hello World</Nice>
    </>
  );
};

export default Header;