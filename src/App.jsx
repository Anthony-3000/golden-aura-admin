import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Categories from './pages/Categories.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Collections from './pages/Collections.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Coupons from './pages/Coupons.jsx';
import Delivery from './pages/Delivery.jsx';
import StateDelivery from './pages/StateDelivery.jsx';
import Reviews from './pages/Reviews.jsx';
import Inquiries from './pages/Inquiries.jsx';
import InquiryDetail from './pages/InquiryDetail.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />

          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />

          <Route path="collections" element={<Collections />} />
          <Route path="collections/:id" element={<CollectionDetail />} />

          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />

          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />

          <Route path="coupons" element={<Coupons />} />

          <Route path="delivery" element={<Delivery />} />
          <Route path="delivery/:stateCode" element={<StateDelivery />} />

          <Route path="reviews" element={<Reviews />} />

          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/:id" element={<InquiryDetail />} />

          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
