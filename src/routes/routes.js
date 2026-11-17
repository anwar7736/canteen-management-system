import { Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/login';
import EmailVerify from '../pages/EmailPage';
import OTPVerify from '../pages/OTPPage';
import ForgetPassword from '../pages/ResetPage';
import ChangePassword from '../pages/ChangePassword';
import ProfilePage from '../pages/ProfilePage';
import DailyMealItemPage from '../pages/DailyMealItemPage';
import SendMessagePage from '../pages/SendMessagePage';
import AdminNotificationPage from '../pages/AdminNotificationPage';
import MyNotificationPage from '../pages/MyNotificationPage';
import OrderDailyMealPage from '../pages/OrderDailyMealPage';
import DayWiseMealPage from '../pages/DayWiseMealPage';
import PaymentPage from '../pages/PaymentPage';
import PaymentSummaryPage from '../pages/PaymentSummaryPage';
import MyTokenPage from '../pages/MyTokenPage';
import MonthlyReportPage from '../pages/MonthlyReportPage';
import AdminPanel from '../admin/AdminPanel';


import PageNotFound from '../pages/PageNotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/email_verification" element={<EmailVerify />} />
      <Route path="/otp_verification" element={<OTPVerify />} />
      <Route path="/reset_password" element={<ForgetPassword />} />
      <Route path="/change_password" element={<ChangePassword />} />
      <Route path="/user_profile" element={<ProfilePage />} />
      <Route path="/dailyMealItem" element={<DailyMealItemPage />} />
      <Route path="/send_message" element={<SendMessagePage />} />
      <Route path="/admin_notification" element={<AdminNotificationPage />} />
      <Route path="/all_notification" element={<MyNotificationPage />} />
      <Route path="/order_daily_meal" element={<OrderDailyMealPage />} />
      <Route path="/day_wise_meal" element={<DayWiseMealPage />} />
      <Route path="/make_payment" element={<PaymentPage />} />
      <Route path="/payment_summary" element={<PaymentSummaryPage />} />
      <Route path="/user_token" element={<MyTokenPage />} />
      <Route path="/monthly_statement" element={<MonthlyReportPage />} />
      <Route path="/admin/*" element={<AdminPanel />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
