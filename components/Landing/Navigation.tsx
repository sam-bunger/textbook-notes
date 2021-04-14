import React from 'react';

import styled from 'styled-components';

export const Navigation = () => {
  return (
    <Menu>
      <FlexContainer>
        <LogoContainer>LOGOMAN</LogoContainer>
        <NavLinkContainer>Join The Waitlist:</NavLinkContainer>
      </FlexContainer>
    </Menu>
  );
};

const Menu = styled.div`
  background-color: blue;
  position: absolute;
  width: 100vw;
  height: 7vh;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0px;
  width: 100%;
  height: 100%;
`;

const LogoContainer = styled.div`
  font-size: 30px;
  padding: 10px;
`;

const NavLinkContainer = styled.div`
  padding: 10px;
`;
