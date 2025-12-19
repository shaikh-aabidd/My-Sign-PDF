// src/router.js
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import {
  HomePage,
  LoginPage,
  ProfilePage,
  SignPdfPage,
} from './pages';
import { NotFound } from './components';
import PdfViewer from './pages/PDFViewerPage';

export default createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />}>
      {/* public */}
      <Route index element={<AuthLayout authentication={true}>
            <HomePage />
          </AuthLayout>} />

      {/* login/signup (public but redirect away if already authed) */}
      <Route
        path="login"
        element={
          <AuthLayout authentication={false}>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="signup"
        element={
          <AuthLayout authentication={false}>
            <LoginPage />
          </AuthLayout>
        }
      />

      {/* protected */}
      <Route
        path="profile"
        element={
          <AuthLayout authentication={true}>
            <ProfilePage />
          </AuthLayout>
        }
      />

      <Route
        path="sign-pdf/:id"
        element={
          <AuthLayout authentication={true}>
            <SignPdfPage />
          </AuthLayout>
        }
      />

      <Route
        path="/view-pdf/:id"
        element={
          <AuthLayout authentication={true}>
            <PdfViewer />
          </AuthLayout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);
