import { API_BASE_URL } from '../lib/api-base-url';

class API {
	static baseURL = API_BASE_URL;
	static login   = this.baseURL + "login";
	static verifyEmail   = this.baseURL + "EmailVerification";
	static GetOTPExpiration   = this.baseURL + "GetOTPExpiration";
	static OTPVerification   = this.baseURL + "OTPVerification";
	static ResetPassword   = this.baseURL + "ResetPassword";
	static ChangePassword   = this.baseURL + "ChangePassword";
	static TwoFactorStatus = this.baseURL + "user/security/two-factor";
	static TwoFactorSetup = this.baseURL + "user/security/two-factor/setup";
	static TwoFactorConfirm = this.baseURL + "user/security/two-factor/confirm";
	static TwoFactorDisable = this.baseURL + "user/security/two-factor/disable";
	static Logout   = this.baseURL + "logout";
	static GetUserProfile   = this.baseURL + "GetUserProfile";
	static GetShopName   = this.baseURL + "GetPublicProfileInfo";
	static GetShopLogo   = this.baseURL + "GetPublicProfileInfo";
	static UpdateProfile   = this.baseURL + "UpdateProfile";
	static GetDailyMealItem   = this.baseURL + "GetDailyMealItem";
	static SendMessage   = this.baseURL + "SendMessage";
	static CountLastest  = this.baseURL + "CountLastestNotification";
	static SetUnreadStatus  = this.baseURL + "SetUnreadStatus";
	static GetAdminNotification  = this.baseURL + "GetAdminNotificationByUser";
	static GetSelfNotification  = this.baseURL + "GetSelfCreatedNotification";
	static SetReadStatus  = this.baseURL + "SetReadStatus";
	static OrderDailyMeal  = this.baseURL + "OrderDailyMeal";
	static GetTodayOrderInfo  = this.baseURL + "GetTodayOrderInfo";
	static ChangeOrderedMeal  = this.baseURL + "ChangeOrderedMeal";
	static DeleteTodayOrder  = this.baseURL + "DeleteTodayOrderedMeal/";
	static RestoreTodayOrder  = this.baseURL + "RestoreTodayOrderedMeal/";
	static GetAllMealByUser  = this.baseURL + "GetAllMealByUser/";
	static PaymentDetailsByUser  = this.baseURL + "PaymentDetailsByUser/";
	static StartMemberPayment = this.baseURL + "member/payment/checkout";
	static PaymentDetailsFilterByDate  = this.baseURL + "PaymentDetailsFilterByDate";
	static GetMealFilterByDate  = this.baseURL + "GetMealFilterByDate/";
	static CountDashboardSummary  = this.baseURL + "CountDashboardSummary/";
	static LastFivePaymentDetails  = this.baseURL + "LastFivePaymentDetails/";
	static LastFiveMonthsStatements  = this.baseURL + "LastFiveMonthsStatements/";
	static LastSevenDaysMealReport  = this.baseURL + "LastSevenDaysMealReport/";
	static GetYearsAndMonths  = this.baseURL + "GetYearsAndMonths";
	static GetMonthlyStatementByKey  = this.baseURL + "GetMonthlyStatementByKey";
	static GetAllMonthlyStatement  = this.baseURL + "GetAllMonthlyStatement/";
    static GetMealRate   = this.baseURL + "GetMealRate";



	
}
export default API;