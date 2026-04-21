import React from 'react';
import { createBrowserRouter, RouterProvider, ScrollRestoration, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import theme from './theme';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import GameResultPage from './pages/GameResultPage';
import HistoryPage from './pages/HistoryPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/game/:id",
        element: <GamePage />,
      },
      {
        path: "/result/:id",
        element: <GameResultPage />,
      },
      {
        path: "/history",
        element: <HistoryPage />,
      },
    ]
  }
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: '#1a1f2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}
      />
    </ThemeProvider>
  );
}

export default App;
