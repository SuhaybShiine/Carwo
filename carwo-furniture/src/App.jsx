import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Users/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';
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

import FabricInventoryList from './pages/Fabric/FabricInventoryList';
import FabricInventoryAdd from './pages/Fabric/FabricInventoryAdd';
import FabricInventoryEdit from './pages/Fabric/FabricInventoryEdit';

// ========== EXCHANGE RATE (SARIF) ==========
import ExchangeRate from './pages/ExchangeRate/ExchangeRate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC — AUTH ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ========== DASHBOARD ========== */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ========== CUSTOMER ========== */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <CustomerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/add"
          element={
            <ProtectedRoute>
              <CustomerAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/edit/:id"
          element={
            <ProtectedRoute>
              <CustomerEdit />
            </ProtectedRoute>
          }
        />

        {/* ========== PRODUCT ========== */}
        <Route
          path="/product"
          element={
            <ProtectedRoute>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/add"
          element={
            <ProtectedRoute>
              <ProductAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/edit/:id"
          element={
            <ProtectedRoute>
              <ProductEdit />
            </ProtectedRoute>
          }
        />

        {/* ========== ORDER ========== */}
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <OrderList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/add"
          element={
            <ProtectedRoute>
              <OrderAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/edit/:id"
          element={
            <ProtectedRoute>
              <OrderEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-state/add/:orderId"
          element={
            <ProtectedRoute>
              <OrderStateAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-state/table/:orderId"
          element={
            <ProtectedRoute>
              <OrderStateTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-state/edit/:id"
          element={
            <ProtectedRoute>
              <OrderStateEdit />
            </ProtectedRoute>
          }
        />

        {/* ========== FABRIC INVENTORY ========== */}
        <Route
          path="/fabric-inventory"
          element={
            <ProtectedRoute>
              <FabricInventoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fabric-inventory/add"
          element={
            <ProtectedRoute>
              <FabricInventoryAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fabric-inventory/edit/:id"
          element={
            <ProtectedRoute>
              <FabricInventoryEdit />
            </ProtectedRoute>
          }
        />

        {/* ========== PAYMENT ========== */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/add"
          element={
            <ProtectedRoute>
              <PaymentAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/edit/:id"
          element={
            <ProtectedRoute>
              <PaymentEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/receipt/:id"
          element={
            <ProtectedRoute>
              <PaymentReceipt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/report"
          element={
            <ProtectedRoute>
              <PaymentReport />
            </ProtectedRoute>
          }
        />

        {/* ========== EXCHANGE RATE (SARIF) — Admin kaliya ========== */}
        <Route
          path="/exchange-rate"
          element={
            <AdminRoute>
              <ExchangeRate />
            </AdminRoute>
          }
        />

        {/* ========== EMPLOYEE — Admin ========== */}
        <Route
          path="/employee"
          element={
            <AdminRoute>
              <EmployeeList />
            </AdminRoute>
          }
        />
        <Route
          path="/employee/add"
          element={
            <AdminRoute>
              <EmployeeAdd />
            </AdminRoute>
          }
        />
        <Route
          path="/employee/edit/:id"
          element={
            <AdminRoute>
              <EmployeeEdit />
            </AdminRoute>
          }
        />

        {/* ========== SUPPLIER — Admin ========== */}
        <Route
          path="/supplier"
          element={
            <AdminRoute>
              <SupplierList />
            </AdminRoute>
          }
        />
        <Route
          path="/supplier/add"
          element={
            <AdminRoute>
              <SupplierAdd />
            </AdminRoute>
          }
        />
        <Route
          path="/supplier/edit/:id"
          element={
            <AdminRoute>
              <SupplierEdit />
            </AdminRoute>
          }
        />

        {/* ========== EXPENSE — Admin ========== */}
        <Route
          path="/expense"
          element={
            <AdminRoute>
              <ExpenseList />
            </AdminRoute>
          }
        />
        <Route
          path="/expense/add"
          element={
            <AdminRoute>
              <ExpenseAdd />
            </AdminRoute>
          }
        />
        <Route
          path="/expense/edit/:id"
          element={
            <AdminRoute>
              <ExpenseEdit />
            </AdminRoute>
          }
        />
        <Route
          path="/expense/report"
          element={
            <AdminRoute>
              <ExpenseReport />
            </AdminRoute>
          }
        />

        {/* ========== SYSTEM REPORT — Admin ========== */}
        <Route
          path="/system-report"
          element={
            <AdminRoute>
              <SystemReport />
            </AdminRoute>
          }
        />

        {/* ========== USERS — Admin ========== */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersList />
            </AdminRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <AdminRoute>
              <ChangePassword />
            </AdminRoute>
          }
        />

        {/* Unknown URL → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;