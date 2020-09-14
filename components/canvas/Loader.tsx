import React from 'react';

interface LoaderProps {}

interface LoaderState {}

export class Loader extends React.Component<LoaderProps, LoaderState> {
  render() {
    return (
      <>
        <h1>This is my loader</h1>
      </>
    );
  }
}
