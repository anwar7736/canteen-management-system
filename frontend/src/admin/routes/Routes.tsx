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
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="email_verification" element={<EmailVerify />} />
      <Route path="otp_verification" element={<OTPVerify />} />
      <Route path="forget_password" element={<ForgetPassword />} />
      <Route path="changePassword" element={<ChangePassword />} />
      <Route path="customer" element={<CustomerPage />} />
      <Route path="daily_meal_item" element={<DailyMealItem />} />
      <Route path="send_notification" element={<SendNotification />} />
      <Route path="order_daily_meal" element={<OrderDailyMeal />} />
      <Route path="day_wise_meal_report" element={<DayWiseMeal />} />
      <Route path="make_payment" element={<Payment />} />
      <Route path="notification" element={<Notification />} />
      <Route path="daily_bazar_cost" element={<DailyBazar />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AdminRoutes;
