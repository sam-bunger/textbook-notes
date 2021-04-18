import React from 'react';

import styled from 'styled-components';
import { Feature1 } from './svgs/Feature1';

export const Features = () => {
  return (
    <MainContainer>
      <FeatureContainer>
        <SvgWrapper>
          <Feature1 />
        </SvgWrapper>
        <FeatureTextContainer>
          <FeatureText>Tie your thoughts directly to your reading.</FeatureText>
          <FeatureSubText>
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo
            ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis
            parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec,
            pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.
          </FeatureSubText>
        </FeatureTextContainer>
      </FeatureContainer>
      <Divider />
      <FeatureContainer type="reverse">
        <SvgWrapper>
          <Feature1 />
        </SvgWrapper>
        <FeatureTextContainer>
          <FeatureText>
            Create definitions that continue to appear throughout the text.
          </FeatureText>
          <FeatureSubText>
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo
            ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis
            parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec,
            pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.
          </FeatureSubText>
        </FeatureTextContainer>
      </FeatureContainer>
    </MainContainer>
  );
};

const MainContainer = styled.div`
  padding: 0 40px 0 40px;
`;

const Divider = styled.div`
  width: 100%;
  border: solid;
`;

const FeatureContainer = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.type === 'reverse' ? 'row-reverse' : 'row')};
  justify-content: center;
  margin: 0;
  width: 100%;
  background-color: ${(props) => props.color ?? 'white'};
`;

const FeatureTextContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 50%;
`;

const FeatureText = styled.p`
  font-size: 30px;
  text-align: center;
  @media (max-width: 700px) {
    font-size: 15px;
    width: 310px;
  }
`;

const FeatureSubText = styled.p`
  font-size: 18px;
  text-align: center;
`;

const SvgWrapper = styled.div`
  width: 75%;
`;
