import React from 'react'
// import './css/styles.scss'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Routing } from './client/routes/Routing';

const router = createBrowserRouter(Routing);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
