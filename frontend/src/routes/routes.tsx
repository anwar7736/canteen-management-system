import { Route, Routes } from 'react-router-dom';
import HomePage from '../legacy-pages/HomePage';
import LoginPage from '../legacy-pages/login';
import EmailVerify from '../legacy-pages/EmailPage';
import OTPVerify from '../legacy-pages/OTPPage';
import ForgetPassword from '../legacy-pages/ResetPage';
import ChangePassword from '../legacy-pages/ChangePassword';
import ProfilePage from '../legacy-pages/ProfilePage';
import DailyMealItemPage from '../legacy-pages/DailyMealItemPage';
import SendMessagePage from '../legacy-pages/SendMessagePage';
import AdminNotificationPage from '../legacy-pages/AdminNotificationPage';
import MyNotificationPage from '../legacy-pages/MyNotificationPage';
import OrderDailyMealPage from '../legacy-pages/OrderDailyMealPage';
import DayWiseMealPage from '../legacy-pages/DayWiseMealPage';
import PaymentPage from '../legacy-pages/PaymentPage';
import PaymentSummaryPage from '../legacy-pages/PaymentSummaryPage';
import MyTokenPage from '../legacy-pages/MyTokenPage';
import MonthlyReportPage from '../legacy-pages/MonthlyReportPage';
import AdminPanel from '../admin/AdminPanel';


import PageNotFound from '../legacy-pages/PageNotFound';

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
