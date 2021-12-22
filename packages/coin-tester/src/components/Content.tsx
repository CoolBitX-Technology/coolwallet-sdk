import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Transport } from '@coolwallet/core';
import { getAppIdOrNull } from '../utils/keypairUtil';
import Settings from './settings';
import CoinTemplate from './coins/template';

interface Props {
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
}

function Content(props: Props) {
  return (
    <Routes>
      <Route
        path='/'
        element={<Settings
          isLocked={props.isLocked}
          setIsLocked={props.setIsLocked}
          transport={props.transport}
          appPrivateKey={props.appPrivateKey}
          appPublicKey={props.appPublicKey}
        />}
      />
      <Route
        path='template'
        element={<CoinTemplate/>}
      />
    </Routes>
  );
}

export default Content;
