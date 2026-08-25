import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import { BottomNavigation, Header } from './components/Navigation';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import RecognizePage from './pages/RecognizePage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import PlantDetailPage from './pages/PlantDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50 pb-20">
              <Header />
              <main className="max-w-lg mx-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/recognize" element={<RecognizePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/plant/:id" element={<PlantDetailPage />} />
                </Routes>
              </main>
              <BottomNavigation />
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
