import React from 'react';

import Router from 'next/router';

import Icon from './Icon'
import Button from './Button'

const defaultMenu = (props: { menuUpdater: (page: string, width: number) => void }) => {

  const { menuUpdater } = props;

  return (
    <div className="menu">
      <button className="menu_item" onClick={() => { menuUpdater("About Me", 0) }}> About Me </button>
      <button className="menu_item" onClick={() => { menuUpdater("Experience", 800) }}> Experience </button>
      <button className="menu_item" onClick={() => { menuUpdater("Projects", 0) }}> Projects </button>
    </div>
  )
}
export default defaultMenu;