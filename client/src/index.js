import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  HashRouter,
  Route
} from "react-router-dom";
import './index.css';
import App from './App';
import Settings from './Settings';
import reportWebVitals from './reportWebVitals';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<App/>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
