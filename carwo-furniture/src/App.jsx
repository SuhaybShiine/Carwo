import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Users/Register';
import UsersList from './pages/Users/UsersList';
import ChangePassword from './pages/Users/ChangePassword';

import Dashboard from './pages/Dashboard';

import EmployeeList from './pages/Employee/EmployeeList';
import EmployeeAdd from './pages/Employee/EmployeeAdd';
import EmployeeEdit from './pages/Employee/EmployeeEdit';

import CustomerList from './pages/Customer/CustomerList';
import CustomerAdd from './pages/Customer/CustomerAdd';
import CustomerEdit from './pages/Customer/CustomerEdit';

import SupplierList from './pages/Supplier/SupplierList';
import SupplierAdd from './pages/Supplier/SupplierAdd';
import SupplierEdit from './pages/Supplier/SupplierEdit';

import ProductList from './pages/Product/ProductList';
import ProductAdd from './pages/Product/ProductAdd';
import ProductEdit from './pages/Product/ProductEdit';

import OrderList from './pages/Order/OrderList';
import OrderAdd from './pages/Order/OrderAdd';
import OrderEdit from './pages/Order/OrderEdit';

import OrderStateAdd from './pages/OrderState/OrderStateAdd';
import OrderStateTable from './pages/OrderState/OrderStateTable';
import OrderStateEdit from './pages/OrderState/OrderStateEdit';

import PaymentList from './pages/Payment/PaymentList';
import PaymentAdd from './pages/Payment/PaymentAdd';
import PaymentEdit from './pages/Payment/PaymentEdit';
import PaymentReceipt from './pages/Payment/PaymentReceipt';
import PaymentReport from './pages/Payment/PaymentReport';

import ExpenseList from './pages/Expense/ExpenseList';
import ExpenseAdd from './pages/Expense/ExpenseAdd';
import ExpenseEdit from './pages/Expense/ExpenseEdit';
import ExpenseReport from './pages/Expense/ExpenseReport';

import SystemReport from './pages/Report/SystemReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Customer — Admin + User */}
        <Route path="/customer" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
        <Route path="/customer/add" element={<ProtectedRoute><CustomerAdd /></ProtectedRoute>} />
        <Route path="/customer/edit/:id" element={<ProtectedRoute><CustomerEdit /></ProtectedRoute>} />

        {/* Product — Admin + User */}
        <Route path="/product" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
        <Route path="/product/add" element={<ProtectedRoute><ProductAdd /></ProtectedRoute>} />
        <Route path="/product/edit/:id" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />

        {/* Order — Admin + User */}
        <Route path="/order" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/order/add" element={<ProtectedRoute><OrderAdd /></ProtectedRoute>} />
        <Route path="/order/edit/:id" element={<ProtectedRoute><OrderEdit /></ProtectedRoute>} />
        <Route path="/order-state/add/:orderId" element={<ProtectedRoute><OrderStateAdd /></ProtectedRoute>} />
        <Route path="/order-state/table/:orderId" element={<ProtectedRoute><OrderStateTable /></ProtectedRoute>} />
        <Route path="/order-state/edit/:id" element={<ProtectedRoute><OrderStateEdit /></ProtectedRoute>} />

        {/* Payment — Admin + User */}
        <Route path="/payment" element={<ProtectedRoute><PaymentList /></ProtectedRoute>} />
        <Route path="/payment/add" element={<ProtectedRoute><PaymentAdd /></ProtectedRoute>} />
        <Route path="/payment/edit/:id" element={<ProtectedRoute><PaymentEdit /></ProtectedRoute>} />
        <Route path="/payment/receipt/:id" element={<ProtectedRoute><PaymentReceipt /></ProtectedRoute>} />
        <Route path="/payment/report" element={<ProtectedRoute><PaymentReport /></ProtectedRoute>} />

        {/* Employee — Admin only */}
        <Route path="/employee" element={<AdminRoute><EmployeeList /></AdminRoute>} />
        <Route path="/employee/add" element={<AdminRoute><EmployeeAdd /></AdminRoute>} />
        <Route path="/employee/edit/:id" element={<AdminRoute><EmployeeEdit /></AdminRoute>} />

        {/* Supplier — Admin only */}
        <Route path="/supplier" element={<AdminRoute><SupplierList /></AdminRoute>} />
        <Route path="/supplier/add" element={<AdminRoute><SupplierAdd /></AdminRoute>} />
        <Route path="/supplier/edit/:id" element={<AdminRoute><SupplierEdit /></AdminRoute>} />

        {/* Expense — Admin only */}
        <Route path="/expense" element={<AdminRoute><ExpenseList /></AdminRoute>} />
        <Route path="/expense/add" element={<AdminRoute><ExpenseAdd /></AdminRoute>} />
        <Route path="/expense/edit/:id" element={<AdminRoute><ExpenseEdit /></AdminRoute>} />
        <Route path="/expense/report" element={<AdminRoute><ExpenseReport /></AdminRoute>} />

        {/* System Report — Admin only */}
        <Route path="/system-report" element={<AdminRoute><SystemReport /></AdminRoute>} />

        {/* Users + Change Password — Admin only */}
        <Route path="/users" element={<AdminRoute><UsersList /></AdminRoute>} />
        <Route path="/change-password" element={<AdminRoute><ChangePassword /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;