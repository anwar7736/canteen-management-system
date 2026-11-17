import { Route, Routes } from 'react-router-dom';
import Home from '../pages/HomePage';
import Login from '../pages/LoginPage';
import EmailVerify from '../pages/EmailVerify';
import OTPVerify from '../pages/OTPVerify';
import ForgetPassword from '../pages/ForgetPassword';
import ChangePassword from '../pages/ChangePassword';
import CustomerPage from '../pages/CustomerPage';
import DailyMealItem from '../pages/DailyMealItem';
import SendNotification from '../pages/SendNotification';
import OrderDailyMeal from '../pages/OrderDailyMeal';
import Payment from '../pages/Payment';
import Notification from '../pages/Notification';
import DayWiseMeal from '../pages/DayWiseMeal';
import DailyBazar from '../pages/DailyBazar';
import Settings from '../pages/Settings';


import NotFound from '../pages/NotFound';

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Home />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/email_verification" element={<EmailVerify />} />
      <Route path="/admin/otp_verification" element={<OTPVerify />} />
      <Route path="/admin/forget_password" element={<ForgetPassword />} />
      <Route path="/admin/changePassword" element={<ChangePassword />} />
      <Route path="/admin/customer" element={<CustomerPage />} />
      <Route path="/admin/daily_meal_item" element={<DailyMealItem />} />
      <Route path="/admin/send_notification" element={<SendNotification />} />
      <Route path="/admin/order_daily_meal" element={<OrderDailyMeal />} />
      <Route path="/admin/day_wise_meal_report" element={<DayWiseMeal />} />
      <Route path="/admin/make_payment" element={<Payment />} />
      <Route path="/admin/notification" element={<Notification />} />
      <Route path="/admin/daily_bazar_cost" element={<DailyBazar />} />
      <Route path="/admin/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AdminRoutes;
