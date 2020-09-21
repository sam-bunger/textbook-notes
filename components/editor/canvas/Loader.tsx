import React from 'react';
import { CircularProgress } from '@material-ui/core';

interface LoaderProps {}

interface LoaderState {}

export class Loader extends React.Component<LoaderProps, LoaderState> {
  render() {
    return (
      <>
        <div className="document-layer document-loader">
          <CircularProgress />
        </div>
      </>
    );
  }
}
