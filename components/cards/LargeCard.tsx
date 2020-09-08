import React from 'react';

import Router from 'next/router';

import Icon from './../Icon'
import Button from './../Button'

const defaultLargeCard = (props: { title: string, description: string }) => {

  const { title, description } = props;

  return (
    <div className="large_card">
      <h3> {title}</h3>
      <p>{description}</p>
    </div>
  )
}
export default defaultLargeCard;