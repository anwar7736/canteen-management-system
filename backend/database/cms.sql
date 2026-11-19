-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 19, 2026 at 02:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cms`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_profile`
--

CREATE TABLE `admin_profile` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_logo` varchar(255) DEFAULT NULL,
  `shop_name` varchar(255) NOT NULL,
  `shop_address` varchar(255) NOT NULL,
  `shop_owner` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `owner_phone` varchar(255) NOT NULL,
  `owner_email` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_profile`
--

INSERT INTO `admin_profile` (`id`, `shop_logo`, `shop_name`, `shop_address`, `shop_owner`, `username`, `owner_phone`, `owner_email`, `created_at`, `updated_at`, `tenant_id`) VALUES
(1, 'https://canteen-api.coderanwar.online/storage/app/public/5CWpq69d7wViYPtkQnHqw27qEVR6dPOtCgA1oR1M.webp', 'Anwar Super Canteen', 'Polashbari, Ashulia, Dhaka', 'Md Anwar Hossain', 'admin1234', '01794030592', 'anwarhossain7736@gmail.com', NULL, NULL, 1),
(2, NULL, 'Demo Canteen', '', 'Demo SaaS Owner', 'demo-saas-owner', '01700000099', 'demo-saas-owner@example.invalid', NULL, NULL, 2);

-- --------------------------------------------------------

--
-- Table structure for table `daily_bazar_costs`
--

CREATE TABLE `daily_bazar_costs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `year` int(11) NOT NULL,
  `month` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_bazar_costs`
--

INSERT INTO `daily_bazar_costs` (`id`, `year`, `month`, `date`, `name`, `amount`, `tenant_id`) VALUES
(8, 2022, 'February', '2022-02-21', 'Anwar', 3000.00, 1),
(9, 2022, 'February', '2022-02-22', 'Anwar', 3500.00, 1),
(12, 2022, 'March', '2022-03-14', 'Sujon Mollah', 1250.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `daily_meal_items`
--

CREATE TABLE `daily_meal_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `day` varchar(255) NOT NULL,
  `lunch_item` varchar(255) NOT NULL,
  `dinner_item` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_meal_items`
--

INSERT INTO `daily_meal_items` (`id`, `day`, `lunch_item`, `dinner_item`, `created_at`, `updated_at`, `tenant_id`) VALUES
(1, 'শনিবার', 'মুরগীর মাংস, সবজি, ডাল', 'বড় মাছ, ভর্তা, ডাল', '2022-02-07 15:58:34', '2026-11-19 03:49:35', 1),
(2, 'রবিবার', 'বড় মাংস, সবজি, ডাল', 'ছোট মাছ, ভর্তা, ডাল', '2022-02-07 15:58:41', '2026-11-19 03:49:35', 1),
(3, 'সোমবার', 'ডিম, ভর্তা, ডাল', 'বড় মাছ, সবজি, ডাল', '2022-02-07 15:58:45', '2022-02-07 15:58:46', 1),
(4, 'মঙ্গলবার', 'মুরগীর মাংস, সবজি, ডাল', 'মলা মাছ ভর্তা, ডাল', '2022-02-07 15:58:47', '2022-02-07 15:58:48', 1),
(5, 'বুধবার', 'বড় মাছ, শাক-সবজি, ডাল', 'বড় মাছ, আলু ভর্তা, ডাল', '2022-02-07 15:58:49', '2022-02-07 15:58:50', 1),
(6, 'বৃহস্পতিবার', 'ছোট মাছ, ভর্তা, ডাল', 'ভুনা খিচুড়ি, সবজি, ডাল', '2022-02-07 15:58:51', '2022-02-07 15:58:52', 1),
(7, 'শুক্রবার', 'গরুর মাংস, সবজি, ডাল', 'ডিম, শাক, ডাল', '2022-02-07 15:58:54', '2022-02-12 13:59:06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `email_otp_verification`
--

CREATE TABLE `email_otp_verification` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `reset_token_hash` char(64) DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_otp_verification`
--

INSERT INTO `email_otp_verification` (`id`, `email`, `otp`, `time`, `date`, `expires_at`, `verified_at`, `reset_token_hash`, `tenant_id`) VALUES
(53, 'mdshahjahansheikh1995@gmail.com', '255134', '09:29:31pm', '2022-01-31', NULL, NULL, NULL, 1),
(55, 'anwarhossain7736@gmail.com', '911952', '09:50:45pm', '2022-02-01', NULL, NULL, NULL, 1),
(56, 'anwarhossain7736@gmail.com', '751875', '09:56:15pm', '2022-02-01', NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meal_rates`
--

CREATE TABLE `meal_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `lunch_expiry_time` varchar(255) NOT NULL,
  `dinner_expiry_time` varchar(255) NOT NULL,
  `lunch_rate` int(11) NOT NULL,
  `lunch_rate_bangla` text NOT NULL,
  `dinner_rate` int(11) NOT NULL,
  `dinner_rate_bangla` text NOT NULL,
  `total_rate` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meal_rates`
--

INSERT INTO `meal_rates` (`id`, `lunch_expiry_time`, `dinner_expiry_time`, `lunch_rate`, `lunch_rate_bangla`, `dinner_rate`, `dinner_rate_bangla`, `total_rate`, `created_at`, `updated_at`, `tenant_id`) VALUES
(1, 'বিকেল ৩টা ৩০মিনিট', 'রাত ১০টা ৩০মিনিট', 60, '৬০টাকা', 50, '৫০টাকা', 110, '2022-02-12 18:22:32', '2022-02-12 19:07:48', 1),
(2, '11:00', '17:00', 0, '0', 0, '0', 0, '2026-11-19 03:46:31', '2026-11-19 03:46:31', 2);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(3, '2021_08_01_153542_email_otp_verification', 2),
(4, '2022_01_15_180927_create_daily_meal_items_table', 3),
(5, '2022_01_15_185710_create_notifications_table', 4),
(6, '2022_01_15_190301_create_notification_details_table', 4),
(13, '2022_01_22_150933_create_payments_table', 7),
(16, '2022_01_17_153112_create_order_meals_table', 8),
(18, '2022_01_25_142927_create_monthly_statements_table', 9),
(19, '2022_01_29_165256_create_jobs_table', 10),
(24, '2022_02_08_153430_create_daily_bazar_costs_table', 12),
(25, '2022_01_17_153007_create_meal_rates_table', 13),
(28, '2022_03_14_182217_create_admin_profile_table', 14),
(33, '2026_11_18_000000_add_sanctum_tokens_and_query_indexes', 15),
(34, '2026_11_18_000001_normalize_dates_and_add_integrity_indexes', 16),
(35, '2026_11_18_000002_add_user_foreign_keys_to_orders_and_notifications', 17),
(36, '2026_11_18_000003_remove_unmatched_demo_payment_snapshots', 18),
(37, '2026_11_19_000000_add_tenants_and_subscription_billing', 19),
(38, '2026_11_19_000001_create_platform_impersonations_table', 20),
(39, '2026_11_19_000002_create_tenant_signup_verifications_table', 21);

-- --------------------------------------------------------

--
-- Table structure for table `monthly_statements`
--

CREATE TABLE `monthly_statements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `year` int(11) NOT NULL,
  `month` varchar(255) NOT NULL,
  `token_no` int(11) NOT NULL,
  `total_lunch` int(11) NOT NULL,
  `lunch_cost` int(11) NOT NULL,
  `total_dinner` int(11) NOT NULL,
  `dinner_cost` int(11) NOT NULL,
  `total_meal` int(11) NOT NULL,
  `total_cost` int(11) NOT NULL,
  `total_payment` decimal(12,2) NOT NULL,
  `give` decimal(12,2) NOT NULL,
  `take` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monthly_statements`
--

INSERT INTO `monthly_statements` (`id`, `year`, `month`, `token_no`, `total_lunch`, `lunch_cost`, `total_dinner`, `dinner_cost`, `total_meal`, `total_cost`, `total_payment`, `give`, `take`, `created_at`, `updated_at`, `tenant_id`) VALUES
(3, 2022, 'January', 142782, 2, 120, 2, 100, 4, 220, 220.00, 0.00, 0.00, NULL, NULL, 1),
(4, 2022, 'February', 142782, 11, 660, 10, 500, 21, 1160, 1000.00, 160.00, 0.00, NULL, NULL, 1),
(5, 2022, 'February', 192328, 9, 540, 8, 400, 17, 940, 500.00, 440.00, 0.00, NULL, NULL, 1),
(6, 2022, 'February', 824720, 1, 60, 1, 50, 2, 110, 0.00, 110.00, 0.00, NULL, NULL, 1),
(7, 2022, 'March', 142782, 4, 240, 4, 200, 8, 450, 4402.00, 0.00, 3952.00, NULL, NULL, 1),
(8, 2022, 'March', 824720, 1, 60, 1, 50, 2, 110, 0.00, 110.00, 0.00, NULL, NULL, 1),
(9, 2022, 'October', 142782, 2, 120, 3, 150, 5, 290, 4000.00, 0.00, 3710.00, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `author_id` bigint(20) UNSIGNED NOT NULL,
  `author_name` varchar(255) NOT NULL,
  `msg_title` varchar(255) NOT NULL,
  `msg_body` text NOT NULL,
  `create_date` varchar(255) NOT NULL,
  `create_time` varchar(255) NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `author_id`, `author_name`, `msg_title`, `msg_body`, `create_date`, `create_time`, `tenant_id`) VALUES
(5, 1, 'Md Anwar Hossain', 'Please Check Your Mail', 'Dear All,\r\nPlease check your mail', '2022-01-16', '09:44:45pm', 1),
(16, 1, 'Md Anwar Hossain', 'Md Anwar Hossain', 'Md Anwar Hossain', '2022-02-14', '02:04:25am', 1),
(20, 1, 'Md Anwar Hossain', 'Declaration for lock down situation', 'Dear All,\r\nWill be off our canteen for some lock down related issues.\r\n\r\nThanks,\r\nMd Anwar Hossain', '2022-10-13', '12:01:55pm', 1),
(21, 4, 'Md Anwar Hossain', 'Request for accept guest meal', 'Dear Admin,\r\nPlease accept my request for tomorrow guest meal', '2022-10-13', '12:17:44pm', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notification_details`
--

CREATE TABLE `notification_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'unread',
  `create_date` varchar(255) NOT NULL,
  `create_time` varchar(255) NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_details`
--

INSERT INTO `notification_details` (`id`, `notification_id`, `user_id`, `status`, `create_date`, `create_time`, `tenant_id`) VALUES
(3, 5, 4, 'Latest', '2022-01-16', '09:44:45pm', 1),
(4, 5, 9, 'Latest', '2022-01-16', '09:44:45pm', 1),
(5, 5, 10, 'Latest', '2022-01-16', '09:44:45pm', 1),
(19, 16, 4, 'Latest', '2022-02-14', '02:04:25am', 1),
(20, 16, 9, 'Latest', '2022-02-14', '02:04:25am', 1),
(21, 16, 10, 'Latest', '2022-02-14', '02:04:25am', 1),
(29, 20, 4, 'Latest', '2022-10-13', '12:01:55pm', 1),
(30, 20, 9, 'Latest', '2022-10-13', '12:01:55pm', 1),
(31, 20, 10, 'Latest', '2022-10-13', '12:01:55pm', 1),
(32, 20, 11, 'Latest', '2022-10-13', '12:01:55pm', 1),
(33, 21, 1, 'Latest', '2022-10-13', '12:17:44pm', 1);

-- --------------------------------------------------------

--
-- Table structure for table `order_meals`
--

CREATE TABLE `order_meals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_no` int(11) NOT NULL,
  `lunch` int(11) NOT NULL,
  `lunch_amount` int(11) NOT NULL,
  `dinner` int(11) NOT NULL,
  `dinner_amount` int(11) NOT NULL,
  `total_meal` int(11) NOT NULL,
  `delivery_charge` decimal(12,2) NOT NULL,
  `total_amount` int(11) NOT NULL,
  `is_parcel` varchar(255) NOT NULL DEFAULT 'No',
  `status` varchar(255) NOT NULL DEFAULT 'Processing',
  `notes` varchar(1000) DEFAULT NULL,
  `meal_given_date` date NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_meals`
--

INSERT INTO `order_meals` (`id`, `user_id`, `token_no`, `lunch`, `lunch_amount`, `dinner`, `dinner_amount`, `total_meal`, `delivery_charge`, `total_amount`, `is_parcel`, `status`, `notes`, `meal_given_date`, `deleted_at`, `created_at`, `updated_at`, `tenant_id`) VALUES
(32, 4, 142782, 5, 300, 5, 250, 10, 0.00, 550, 'No', 'Completed', NULL, '2022-02-08', NULL, '2022-02-07 15:48:02', '2022-02-07 15:48:02', 1),
(33, 10, 192328, 5, 300, 5, 250, 10, 0.00, 550, 'No', 'Completed', NULL, '2022-02-08', NULL, '2022-02-07 15:54:23', '2022-02-07 15:54:23', 1),
(35, 10, 192328, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-12', NULL, '2022-02-11 15:50:00', '2022-02-11 15:50:00', 1),
(38, 4, 142782, 2, 120, 2, 100, 4, 0.00, 220, 'No', 'Completed', NULL, '2022-02-14', NULL, '2022-02-13 10:29:23', '2022-02-13 04:30:17', 1),
(41, 4, 142782, 2, 120, 1, 50, 3, 0.00, 170, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 18:41:30', '2022-02-13 13:19:49', 1),
(42, 10, 192328, 3, 180, 2, 100, 5, 0.00, 280, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 19:07:36', '2022-02-13 13:20:34', 1),
(43, 9, 824720, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 19:07:57', '2022-02-13 13:20:28', 1),
(44, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-21', NULL, '2022-02-20 14:52:51', '2022-02-20 14:52:51', 1),
(45, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-22', NULL, '2022-02-21 14:52:13', '2022-02-21 14:52:13', 1),
(49, 9, 824720, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', 'তরকারিতে ঝাল কম দিয়েন', '2022-03-22', NULL, '2022-03-17 21:53:23', '2022-03-17 15:53:46', 1),
(50, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Pending', NULL, '2022-03-22', NULL, '2022-03-17 22:50:39', '2022-03-23 09:44:00', 1),
(51, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'Yes', 'Completed', NULL, '2022-03-22', NULL, '2022-03-19 18:42:55', '2022-10-12 09:36:08', 1),
(52, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'Yes', 'Completed', NULL, '2022-03-23', NULL, '2022-03-22 17:53:15', '2022-03-22 16:45:44', 1),
(99, 4, 142782, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Processing', NULL, '2022-03-24', '2022-03-23 09:15:31', '2022-03-22 21:31:18', '2022-03-23 09:15:31', 1),
(100, 4, 142782, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Completed', 'আমাকে একটু ভাত বেশি করে দিয়েন', '2022-03-24', NULL, '2022-03-23 15:19:10', '2022-03-23 09:20:17', 1),
(101, 4, 142782, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Processing', NULL, '2022-10-08', NULL, '2022-10-07 17:03:26', '2022-10-07 11:03:33', 1),
(102, 4, 142782, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Processing', 'null', '2022-10-13', '2022-10-12 09:50:02', '2022-10-12 14:50:32', '2022-10-12 09:50:02', 1),
(103, 4, 142782, 1, 60, 2, 100, 3, 10.00, 170, 'Yes', 'Processing', NULL, '2022-10-13', NULL, '2022-10-12 15:50:16', '2022-10-12 09:50:24', 1);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `year` int(11) NOT NULL,
  `month` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `token_no` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `currency` varchar(255) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_time` varchar(255) NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `year`, `month`, `name`, `token_no`, `email`, `phone`, `amount`, `address`, `transaction_id`, `status`, `currency`, `payment_date`, `payment_time`, `tenant_id`) VALUES
(11, 2022, 'February', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 500.00, 'Polashbari, Ashulia, Dhaka', '6201405ba7b0a', 'Completed', 'BDT', '2022-02-07', '09:52:59pm', 1),
(12, 2022, 'February', 'Md Anwar Hossain', 192328, 'abc@gmail.com', '01794030592', 400.00, 'Polashbari, Ashulia, Dhaka', '620140c360625', 'Completed', 'BDT', '2022-02-07', '09:54:43pm', 1),
(18, 2022, 'February', 'Shara Enterprise', 192328, 'shara_enterprise@yahoo.com', '01715424526', 100.00, 'Polashbari, Ashulia, Dhaka', '620FB9800269E', 'Completed', 'BDT', '2022-02-18', '09:21:36pm', 1),
(20, 2022, 'February', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 500.00, 'Polashbari, Ashulia, Dhaka', '6213B8694BB53', 'Processing', 'BDT', '2022-02-21', '10:06:01pm', 1),
(22, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '623624C00C90F', 'Canceled', 'BDT', '2022-03-20', '12:45:20am', 1),
(23, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 100.50, 'Polashbari, Ashulia, Dhaka', '623B3AF5650D7', 'Pending', 'BDT', '2022-03-23', '09:21:25pm', 1),
(26, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 100.50, 'Polashbari, Ashulia, Dhaka', '623B3B35E797A', 'Pending', 'BDT', '2022-03-23', '09:22:29pm', 1),
(27, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 100.50, 'Polashbari, Ashulia, Dhaka', '623B3B69107C6', 'Pending', 'BDT', '2022-03-23', '09:23:21pm', 1),
(28, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 100.50, 'Polashbari, Ashulia, Dhaka', '623B3B9F0E10E', 'Pending', 'BDT', '2022-03-23', '09:24:15pm', 1),
(29, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '623B3C7C50E06', 'Pending', 'BDT', '2022-03-23', '09:27:56pm', 1),
(30, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '623B3CCAB323A', 'Pending', 'BDT', '2022-03-23', '09:29:14pm', 1),
(31, 2022, 'March', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '623B3CDD27FE1', 'Pending', 'BDT', '2022-03-23', '09:29:33pm', 1),
(33, 2022, 'September', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '63405C96E6FD9', 'Completed', 'BDT', '2022-10-07', '11:06:30pm', 1),
(34, 2022, 'October', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '63405D5E4449A', 'Processing', 'BDT', '2022-10-07', '11:09:50pm', 1),
(35, 2022, 'October', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '6346DC6AE7B37', 'Processing', 'BDT', '2022-10-12', '09:25:30pm', 1),
(36, 2022, 'October', 'Md Anwar Hossain', 142782, 'abc@gmail.com', '01794030592', 1000.00, 'Polashbari, Ashulia, Dhaka', '6347AA5C525A3', 'Processing', 'BDT', '2022-10-13', '12:04:12pm', 1);

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `created_at`, `updated_at`, `expires_at`) VALUES
(5, 'App\\Models\\User', 14, 'platform-admin', '77c0ddf090d32ef1f4a70cc36a653574831f99136381a1c76f32585b1bedf455', '[\"platform_admin\"]', NULL, '2026-11-19 03:45:56', '2026-11-19 03:45:56', NULL),
(6, 'App\\Models\\User', 15, 'tenant-owner', 'dfbd7ba78d4e4978d7e10d850d1e32da2d33e36d41e0b8653e1283b3d0da2b7e', '[\"admin\"]', NULL, '2026-11-19 03:46:31', '2026-11-19 03:46:31', NULL),
(7, 'App\\Models\\User', 17, 'platform-admin', '6951f5f20e57ca8928a1a823a45d13a0af71168278a7357fb6390ce6f0e6a1cb', '[\"platform_admin\"]', NULL, '2026-11-19 03:50:40', '2026-11-19 03:50:40', NULL),
(8, 'App\\Models\\User', 17, 'platform-admin', '33a95cd8a973d247d564f022a786722eaa0335929e59e00ba4c302fe7582c275', '[\"platform_admin\"]', NULL, '2026-11-19 04:29:47', '2026-11-19 04:29:47', NULL),
(9, 'App\\Models\\User', 17, 'platform-admin', 'ae134af036a62ed00667290bb7e689e9b20292df9bfc67c1d689542b9c8fb34f', '[\"platform_admin\"]', NULL, '2026-11-19 04:30:04', '2026-11-19 04:30:04', NULL),
(10, 'App\\Models\\User', 17, 'platform-admin', '5445e7abd36f95699426d156996233945de7d0e6273b19b41009409c09234d1f', '[\"platform_admin\"]', NULL, '2026-11-19 04:30:32', '2026-11-19 04:30:32', NULL),
(11, 'App\\Models\\User', 17, 'platform-admin', '04a7673963bf712debe3a3c241c76f73e783131026599644337005d46167a8eb', '[\"platform_admin\"]', '2026-11-19 06:21:18', '2026-11-19 04:43:33', '2026-11-19 06:21:18', NULL),
(12, 'App\\Models\\User', 17, 'platform-admin', 'a3e193c590474aa3b6b6ff227a5933eda70bd667e5ac46b8c14277655ef07830', '[\"platform_admin\"]', NULL, '2026-11-19 04:48:42', '2026-11-19 04:48:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `platform_impersonations`
--

CREATE TABLE `platform_impersonations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `platform_admin_id` bigint(20) UNSIGNED NOT NULL,
  `platform_admin_username` varchar(255) NOT NULL,
  `target_user_id` bigint(20) UNSIGNED NOT NULL,
  `target_username` varchar(255) NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `tenant_name` varchar(255) NOT NULL,
  `tenant_slug` varchar(255) NOT NULL,
  `access_token_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `subscription_id` bigint(20) UNSIGNED NOT NULL,
  `plan_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` char(3) NOT NULL,
  `transaction_id` varchar(64) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Pending',
  `gateway` varchar(255) NOT NULL DEFAULT 'sslcommerz',
  `period_start` timestamp NULL DEFAULT NULL,
  `period_end` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `interval` varchar(255) NOT NULL DEFAULT 'monthly',
  `trial_days` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `max_members` int(10) UNSIGNED DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `slug`, `price`, `currency`, `interval`, `trial_days`, `max_members`, `features`, `active`, `created_at`, `updated_at`) VALUES
(1, 'Starter', 'starter', 0.00, 'BDT', 'monthly', 14, NULL, '[\"member_management\",\"meal_orders\",\"reports\"]', 1, '2026-11-19 03:43:23', '2026-11-19 03:43:23'),
(2, 'Legacy', 'legacy', 0.00, 'BDT', 'monthly', 0, NULL, '[\"member_management\",\"meal_orders\",\"reports\"]', 1, '2026-11-19 03:43:23', '2026-11-19 03:43:23'),
(3, 'Canteen Pro', 'canteen-pro', 1000.00, 'BDT', 'monthly', 14, NULL, '[\"member_management\",\"meal_orders\",\"reports\",\"priority_support\"]', 1, '2026-11-19 03:43:23', '2026-11-19 03:43:23');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `slug`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Anwar Super Canteen', 'anwar-super-canteen', 'active', '2026-11-19 03:43:23', '2026-11-19 03:43:23'),
(2, 'Demo Canteen', 'demo-canteen-2026', 'active', '2026-11-19 03:46:30', '2026-11-19 05:03:30');

-- --------------------------------------------------------

--
-- Table structure for table `tenant_signup_verifications`
--

CREATE TABLE `tenant_signup_verifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `signup_token_hash` char(64) DEFAULT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tenant_subscriptions`
--

CREATE TABLE `tenant_subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `plan_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `starts_at` timestamp NULL DEFAULT NULL,
  `current_period_start` timestamp NULL DEFAULT NULL,
  `current_period_end` timestamp NULL DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `canceled_at` timestamp NULL DEFAULT NULL,
  `gateway` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenant_subscriptions`
--

INSERT INTO `tenant_subscriptions` (`id`, `tenant_id`, `plan_id`, `status`, `starts_at`, `current_period_start`, `current_period_end`, `trial_ends_at`, `canceled_at`, `gateway`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'active', '2026-11-19 03:43:25', NULL, NULL, NULL, NULL, NULL, '2026-11-19 03:43:25', '2026-11-19 03:43:25'),
(2, 2, 1, 'trialing', '2026-11-19 03:46:31', '2026-11-19 03:46:31', '2026-12-03 03:46:31', '2026-12-03 03:46:31', NULL, NULL, '2026-11-19 03:46:31', '2026-11-19 03:46:31');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `token_no` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `password` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `token_no`, `name`, `username`, `email`, `phone`, `role`, `status`, `password`, `address`, `photo`, `created_at`, `updated_at`) VALUES
(1, 1, 101101, 'Md Anwar Hossain', 'admin1234', 'anwarhossain7736@gmail.com', '01794030592', 'admin', 'active', '$2y$10$TNTNLwY0bIY0QJlVYm27n.udAn4n8kaRYXvhpFwk/JGbbpwTuJeom', 'Polashbari, Ashulia, Dhaka', NULL, '2022-01-09 09:42:41', '2022-03-19 13:43:12'),
(4, 1, 142782, 'Anwar', 'anwar123', 'anwar@gmail.com', '01795700837', 'user', 'active', '$2y$10$gA2dLvyNMSdZ1ZjahqksLOHWrxOQTvVU1NMvWl1xhvVqhCcLCSapu', 'Polashbari, Ashulia, Dhaka', 'http://canteen-api.coderanwar.online/storage/app/public/XMfTIzKJexI0eREqAYKOPLWFgKvg7nVJBUkrXPlF.jpg', '2022-01-09 09:42:41', '2022-10-12 09:29:46'),
(9, 1, 824720, 'Sujon', 'sujon123', 'mdshahjahansheikh1995@gmail.com', '01715414525', 'user', 'active', '$2y$10$ms.dc/xaupEwF9pMrSMtk.nH6XlqUEH/tMMZwaP3fyil3S4roWKM2', 'Savar,Dhaka', 'http://canteen-api.coderanwar.online/storage/app/public/b014cQa0nAq1FfYzoDJw6eQTlumqhADg2qnFRWzk.jpg', '2022-02-06 10:42:12', '2022-02-20 09:40:08'),
(10, 1, 192328, 'Shara Enterprise', 'shara1234', 'shara_enterprise@yahoo.com', '01715424526', 'user', 'inactive', '$2y$10$l205ZeJruxRam8TgnHI6Se1JUF/cRD2HFa0S7rceNgdrWBwZ14YKi', 'Polashbari, Ashulia, Dhaka', 'http://canteen-api.coderanwar.online/storage/app/public/US8GKKLqrkhlsT8dISBNQpmSYO3tUaix3KbYI5Ex.jpg', '2022-02-06 11:28:12', '2022-02-20 09:44:24'),
(11, 1, 515874, 'Md Ariful Islam', 'ariful123', 'arifmiah8044@gmail.com', '01700000000', 'user', 'active', '$2y$10$ZTdX6tEX6Q.hv31Mf82TxusSrWi5EisBFnwb.3RBp2BaEKhbpCjLK', 'Tangail, Dhaka.', 'http://canteen-api.coderanwar.online/storage/app/public/wHzyfH4pSsQgWZzbeBdOIwfJPZ97Z3CalexxVpOD.jpg', '2022-02-16 09:17:49', '2022-02-16 13:13:57'),
(14, NULL, 946139, 'Demo Platform Admin', 'demo-platform-admin', 'demo-platform@example.invalid', '', 'platform_admin', 'active', '$2y$10$3blQsT58o3YUECe7BMf0LOE5ABzUUG2fHAXsYpnGWqPIFuzoevo56', NULL, NULL, '2026-11-19 03:45:36', '2026-11-19 03:45:36'),
(15, 2, 452548, 'Demo SaaS Owner', 'demo-saas-owner', 'demo-saas-owner@example.invalid', '01700000099', 'admin', 'active', '$2y$10$eVk5otfzVhZFkkEF5/NdK.mse0.kKzSAon5DvyJJiTM1Imuzw30q2', NULL, NULL, '2026-11-19 03:46:31', '2026-11-19 03:46:31'),
(16, 1, 112477, 'Platform Admin', 'platform-admin', 'admin@example.com', '', 'platform_admin', 'active', '$2y$10$HHVgm2cf3eOQBJ/cb5cB5.fGzNjAvZqL5U/CFmgNkeQ2cKimCMKf6', NULL, NULL, '2026-11-19 03:49:35', '2026-11-19 03:49:35'),
(17, NULL, 533085, 'Platform Admin', 'platform-admin', 'admin@example.com', '', 'platform_admin', 'active', '$2y$10$FmLapSklhvAo800xgz0R4u1.AGOQicorWHwkUZsivGPsOuM2BK6zi', NULL, NULL, '2026-11-19 03:50:24', '2026-11-19 03:50:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_profile`
--
ALTER TABLE `admin_profile`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_profile_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `daily_bazar_costs`
--
ALTER TABLE `daily_bazar_costs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bazar_tenant_date_unique` (`tenant_id`,`date`),
  ADD KEY `daily_bazar_costs_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `daily_meal_items`
--
ALTER TABLE `daily_meal_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `daily_meals_tenant_day_unique` (`tenant_id`,`day`),
  ADD KEY `daily_meal_items_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `email_otp_verification`
--
ALTER TABLE `email_otp_verification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `otp_email_expiry_index` (`email`,`expires_at`),
  ADD KEY `otp_reset_token_hash_index` (`reset_token_hash`),
  ADD KEY `email_otp_verification_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `meal_rates`
--
ALTER TABLE `meal_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `meal_rates_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `monthly_statements`
--
ALTER TABLE `monthly_statements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `statements_tenant_period_unique` (`tenant_id`,`token_no`,`year`,`month`),
  ADD KEY `monthly_statements_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_author_id_id_index` (`author_id`,`id`),
  ADD KEY `notifications_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `notification_details`
--
ALTER TABLE `notification_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_recipients_unique` (`notification_id`,`user_id`),
  ADD KEY `notification_user_item_index` (`user_id`,`notification_id`),
  ADD KEY `notification_user_status_index` (`user_id`,`status`),
  ADD KEY `notification_user_recent_index` (`user_id`,`id`,`notification_id`),
  ADD KEY `notification_details_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `order_meals`
--
ALTER TABLE `order_meals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orders_user_date_index` (`user_id`,`meal_given_date`),
  ADD KEY `orders_token_date_index` (`token_no`,`meal_given_date`),
  ADD KEY `orders_meal_date_deleted_index` (`meal_given_date`,`deleted_at`),
  ADD KEY `order_meals_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_transaction_id_unique` (`transaction_id`),
  ADD KEY `payments_token_date_index` (`token_no`,`payment_date`),
  ADD KEY `payments_date_id_index` (`payment_date`,`id`),
  ADD KEY `payments_token_period_amount_index` (`token_no`,`year`,`month`,`amount`),
  ADD KEY `payments_date_token_amount_index` (`payment_date`,`token_no`,`amount`),
  ADD KEY `payments_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `platform_impersonations`
--
ALTER TABLE `platform_impersonations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `platform_impersonations_platform_admin_id_index` (`platform_admin_id`),
  ADD KEY `platform_impersonations_target_user_id_index` (`target_user_id`),
  ADD KEY `platform_impersonations_tenant_id_index` (`tenant_id`),
  ADD KEY `platform_impersonations_access_token_id_index` (`access_token_id`),
  ADD KEY `platform_impersonations_expires_at_index` (`expires_at`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subscription_payments_transaction_id_unique` (`transaction_id`),
  ADD KEY `subscription_payments_subscription_id_foreign` (`subscription_id`),
  ADD KEY `subscription_payments_plan_id_foreign` (`plan_id`),
  ADD KEY `subscription_payments_tenant_created_index` (`tenant_id`,`created_at`),
  ADD KEY `subscription_payments_status_index` (`status`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subscription_plans_slug_unique` (`slug`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenants_slug_unique` (`slug`);

--
-- Indexes for table `tenant_signup_verifications`
--
ALTER TABLE `tenant_signup_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `signup_verifications_email_active_index` (`email`,`consumed_at`,`id`),
  ADD KEY `tenant_signup_verifications_email_index` (`email`),
  ADD KEY `tenant_signup_verifications_expires_at_index` (`expires_at`);

--
-- Indexes for table `tenant_subscriptions`
--
ALTER TABLE `tenant_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tenant_subscriptions_plan_id_foreign` (`plan_id`),
  ADD KEY `tenant_subscriptions_status_period_index` (`tenant_id`,`status`,`current_period_end`),
  ADD KEY `tenant_subscriptions_status_index` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_tenant_email_unique` (`tenant_id`,`email`),
  ADD UNIQUE KEY `users_tenant_phone_unique` (`tenant_id`,`phone`),
  ADD UNIQUE KEY `users_tenant_username_unique` (`tenant_id`,`username`),
  ADD UNIQUE KEY `users_tenant_token_unique` (`tenant_id`,`token_no`),
  ADD KEY `users_role_status_index` (`role`,`status`),
  ADD KEY `users_role_id_index` (`role`,`id`),
  ADD KEY `users_tenant_role_status_index` (`tenant_id`,`role`,`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_profile`
--
ALTER TABLE `admin_profile`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `daily_bazar_costs`
--
ALTER TABLE `daily_bazar_costs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `daily_meal_items`
--
ALTER TABLE `daily_meal_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `email_otp_verification`
--
ALTER TABLE `email_otp_verification`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT for table `meal_rates`
--
ALTER TABLE `meal_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `monthly_statements`
--
ALTER TABLE `monthly_statements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `notification_details`
--
ALTER TABLE `notification_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `order_meals`
--
ALTER TABLE `order_meals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `platform_impersonations`
--
ALTER TABLE `platform_impersonations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tenant_signup_verifications`
--
ALTER TABLE `tenant_signup_verifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tenant_subscriptions`
--
ALTER TABLE `tenant_subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_profile`
--
ALTER TABLE `admin_profile`
  ADD CONSTRAINT `admin_profile_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_bazar_costs`
--
ALTER TABLE `daily_bazar_costs`
  ADD CONSTRAINT `daily_bazar_costs_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_meal_items`
--
ALTER TABLE `daily_meal_items`
  ADD CONSTRAINT `daily_meal_items_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `email_otp_verification`
--
ALTER TABLE `email_otp_verification`
  ADD CONSTRAINT `email_otp_verification_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `meal_rates`
--
ALTER TABLE `meal_rates`
  ADD CONSTRAINT `meal_rates_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `monthly_statements`
--
ALTER TABLE `monthly_statements`
  ADD CONSTRAINT `monthly_statements_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_author_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_details`
--
ALTER TABLE `notification_details`
  ADD CONSTRAINT `notification_details_notification_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_details_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_details_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_meals`
--
ALTER TABLE `order_meals`
  ADD CONSTRAINT `order_meals_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_meals_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD CONSTRAINT `subscription_payments_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  ADD CONSTRAINT `subscription_payments_subscription_id_foreign` FOREIGN KEY (`subscription_id`) REFERENCES `tenant_subscriptions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tenant_subscriptions`
--
ALTER TABLE `tenant_subscriptions`
  ADD CONSTRAINT `tenant_subscriptions_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  ADD CONSTRAINT `tenant_subscriptions_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
