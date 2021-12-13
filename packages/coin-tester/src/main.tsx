import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

window.Buffer = Buffer;

declare global {
  interface Window {
    Buffer:any;
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
