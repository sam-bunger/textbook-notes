import React, { useState } from 'react';
import styled from 'styled-components';

type ContactProps = {
  inputWidth: string;
};

type ContactState = {
  email: string;
};

export const Contact = (props: ContactProps) => {
  const [{ email }, setState] = useState<ContactState>({ email: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({
      email: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(e.target);
  };

  return (
    <ContactForm onSubmit={handleSubmit}>
      <EmailInput width={props.inputWidth}></EmailInput>
      <Submit></Submit>
    </ContactForm>
  );
};

const ContactForm = styled.form`
  padding: 11px;
  overflow: hidden;
`;

const Submit = styled.input.attrs({ type: 'submit' })`
  height: 36px;
  width: 80px;
  margin-left: 20px;
  padding: 0px;
  border: none;
  border-radius: 6px;
  transition: 0.3s;
  font-family: 'Montserrat', sans-serif;
  :hover {
    transition: 0.3s;
    -webkit-box-shadow: 0px 0px 11px 1px rgba(0, 0, 0, 0.13);
    box-shadow: 0px 0px 11px 1px rgba(0, 0, 0, 0.13);
    background-color: #f5f5f5;
  }
`;

const EmailInput = styled.input.attrs({
  type: 'email',
  id: 'inputEmail',
  className: 'form-control',
  placeholder: 'Email Address'
})`
  height: 35px;
  width: ${(props) => props.width + 'px'};
  border: none;
  font-family: 'Montserrat', sans-serif;
  border-radius: 6px;
  background-color: #d8d8d8;
  padding-left: 10px;
`;
