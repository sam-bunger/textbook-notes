import React from 'react';

const defaultButton = (props: { name: string, fn?: () => void }) => {
  const { name, fn } = props
  return (
    <button className="button" onClick={fn}> {name} </button>
  )
}
export default defaultButton;