import React from 'react';

import styled from 'styled-components';
import { Contact } from './Contact';

export const Navigation = () => {
  return (
    <div>
      <Menu>
        <FlexContainer>
          <FlexContainer>
            <NavLinkContainer>
              <FlexContainer>
                <NavLinkContainer width="auto">
                  <P>Join our waitlist</P>
                </NavLinkContainer>
                <EmptySpace />
                <NavLinkContainer width="auto">
                  <Contact inputWidth="450" />
                </NavLinkContainer>
              </FlexContainer>
            </NavLinkContainer>
          </FlexContainer>
        </FlexContainer>
        <LogoFlexContainer>
          <LogoContainer>App Name</LogoContainer>
        </LogoFlexContainer>
      </Menu>
      <NavPadding />
    </div>
  );
};

const NavPadding = styled.div`
  padding: 30px;
`;

const Menu = styled.div`
  background-color: #f5f5f5;
  position: fixed;
  overflow: hidden;
  -webkit-box-shadow: 0px 0px 15px 1px rgba(0, 0, 0, 0.2);
  box-shadow: 0px 0px 15px 1px rgba(0, 0, 0, 0.2);
  width: 100vw;
  height: 60px;
  z-index: 10;
`;

const EmptySpace = styled.div`
  width: 20px;
`;

const FlexContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  padding: 0px;
  width: 100vw;
  height: 100%;
  justify-content: center;
  @media (max-width: 920px) {
    display: none;
  }
`;

const LogoFlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0px;
  width: 100vw;
  height: 100%;
  @media (max-width: 920px) {
    justify-content: center;
  }
`;

const LogoContainer = styled.h5`
  font-size: 25px;
  padding: 13px;
  margin-top: 2px;
  margin-left: 20px;
`;

const P = styled.p`
  margin: 0;
  padding: 11px;
  margin-top: 10px;
  overflow: hidden;
  white-space: nowrap;
`;

const NavLinkContainer = styled.div`
  float: right;
  width: ${(props) => props.width ?? '100%'};
`;
