import React from 'react';

import styled from 'styled-components';

import { HeroImage } from './svgs/HeroImage';

export const Hero = () => {
  return (
    <MainContainer color="#f9f8f6">
      <Container>
        <TagLineText>Take notes the right way.</TagLineText>
        <FlexContainer>
          <ValuePropText>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            Lorem Ipsum has been the industry&apos;s standard dummy text ever since the
            1500s.
          </ValuePropText>
        </FlexContainer>
      </Container>
      <Container2>
        <SvgWrapper>
          <HeroImage />
        </SvgWrapper>
      </Container2>
    </MainContainer>
  );
};

const SvgWrapper = styled.div`
  position: absolute;
  width: 65vw;
  margin-left: -5vw;
  margin-top: 150px;

  @media (max-width: 1200px) {
    margin-top: 70px;
    width: 90vw;
    margin-left: auto;
    position: relative;
    margin-bottom: 30px;
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 700px;
  background-color: ${(props) => props.color};
  width: 100%;
  overflow-x: hidden;
  @media (max-width: 1200px) {
    flex-direction: column;
    height: auto;
  }
`;

const Container = styled.div`
  padding-left: 6vw;
  margin: 0;
  margin-top: 200px;
  @media (max-width: 1200px) {
    padding-left: 0;
    margin-top: 100px;
  }
`;

const Container2 = styled.div`
  padding-left: 6vw;
  margin: 0;
  margin-top: -6vw;
  @media (max-width: 1200px) {
    padding-left: 0;
  }
`;

const FlexContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 0;
`;

const TagLineText = styled.h1`
  font-size: 55px;
  margin: 0;
  padding: 0px 10px 60px 10px;
  text-align: center;
  @media (max-width: 700px) {
    font-size: 40px;
    padding-bottom: 20px;
  }
`;

const ValuePropText = styled.p`
  font-size: 20px;
  width: 500px;
  text-align: center;
  @media (max-width: 700px) {
    font-size: 15px;
    width: 310px;
  }
`;
