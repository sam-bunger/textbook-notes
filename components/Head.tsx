import React from 'react';
import Head from 'next/head';

const defaultHead = (props: { title: string; description?: string }) => {
  const { title, description } = props;
  return (
    <Head>
      <title>{`${title}`}</title>
      <meta name="description" content={description} />
      <link rel="stylesheet" href="/static/css/style.css" />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;1,100;1,200;1,300;1,400;1,500;1,600&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
    </Head>
  );
};
export default defaultHead;
