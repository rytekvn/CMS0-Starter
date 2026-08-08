// Router + khung layout. Them module moi = them <Route> trong day.
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthContext, useAuthState } from "./auth/useCurrentUser";
import { Login } from "./auth/Login";
import { RouteGuard } from "./auth/RouteGuard";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { ProductList } from "./modules/products/list";
import { ProductCreate } from "./modules/products/create";
import { ProductDetail } from "./modules/products/detail";
import { ProductEdit } from "./modules/products/edit";

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthContext.Provider value={useAuthState()}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RouteGuard>
                <AppLayout />
              </RouteGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/new" element={<ProductCreate />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
