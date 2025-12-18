import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { Web3Provider } from './context/Web3Context.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { UserOnlyRoute } from './components/common/UserOnlyRoute.jsx';
import { Header } from './components/layout/Header.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { CreateProductPage } from './pages/CreateProductPage.jsx';
import { EditProductPage } from './pages/EditProductPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { OrderDetailPage } from './pages/OrderDetailPage.jsx';
import { CourierDashboardPage } from './pages/CourierDashboardPage.jsx';
import { AvailableShipmentsPage } from './pages/AvailableShipmentsPage.jsx';
import { MyShipmentsPage } from './pages/MyShipmentsPage.jsx';
import { ConfirmPickupPage } from './pages/ConfirmPickupPage.jsx';
import { ConfirmDeliveryPage } from './pages/ConfirmDeliveryPage.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--medium-gray)',
              color: 'var(--white)',
              border: '1px solid var(--light-gray)',
            },
            success: {
              iconTheme: {
                primary: '#51cf66',
                secondary: 'var(--white)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff6b6b',
                secondary: 'var(--white)',
              },
            },
          }}
        />
        <Router>
          <div className="App">
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route
                path="/products/create"
                element={
                  <UserOnlyRoute>
                    <CreateProductPage />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/products/:id/edit"
                element={
                  <UserOnlyRoute>
                    <EditProductPage />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <UserOnlyRoute>
                    <OrdersPage />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <UserOnlyRoute>
                    <OrderDetailPage />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/dashboard"
                element={
                  <ProtectedRoute>
                    <CourierDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/available"
                element={
                  <ProtectedRoute>
                    <AvailableShipmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/shipments"
                element={
                  <ProtectedRoute>
                    <MyShipmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/pickup"
                element={
                  <ProtectedRoute>
                    <ConfirmPickupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/delivery"
                element={
                  <ProtectedRoute>
                    <ConfirmDeliveryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
