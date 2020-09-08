import React from 'react';
import Head from 'next/head';

const defaultHead = (props: { title: string; description?: string }) => {
  const { title, description } = props;
  return (
    <Head>
      <title>{`${title}`}</title>
      <meta name="description" content={description} />
      <link rel="stylesheet" href="/static/css/style.css" />
    </Head>
  );
};
export default defaultHead;
