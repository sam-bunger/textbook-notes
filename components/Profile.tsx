import React from 'react';

import Router from 'next/router';

import Icon from './Icon'
import Button from './Button'

const defaultProfile = (props: { imageSource: string, linkedinUrl: string, githubUrl: string}) => {
  const { imageSource, linkedinUrl, githubUrl } = props

  const goToResume = () => {
    Router.push("resume")
  }

  return (
    <div className="profile">
      <img className="profile_image" src={imageSource} /> 
      <h1 className="profile_title"> Sam Bunger </h1>
      <div className="profile_items">
        <a className="profile_icon" href={linkedinUrl}> <Icon name="linkedin" /></a>
        <a className="profile_icon" href={githubUrl}> <Icon name="github" /></a>
        <Button name="Resume" fn={goToResume} />
      </div>
    </div>
  )
}
export default defaultProfile;