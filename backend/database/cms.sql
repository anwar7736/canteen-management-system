-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 18, 2026 at 02:08 PM
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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_profile`
--

INSERT INTO `admin_profile` (`id`, `shop_logo`, `shop_name`, `shop_address`, `shop_owner`, `username`, `owner_phone`, `owner_email`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Demo Canteen', 'Demo Address', 'Demo Owner', 'demo-admin', '00000000001', 'owner@example.invalid', NULL, NULL);

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
  `amount` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_bazar_costs`
--

INSERT INTO `daily_bazar_costs` (`id`, `year`, `month`, `date`, `name`, `amount`) VALUES
(8, 2022, 'February', '2022-02-21', 'Demo Member', 3000.00),
(9, 2022, 'February', '2022-02-22', 'Demo Member', 3500.00),
(12, 2022, 'March', '2022-03-14', 'Demo Member', 1250.00);

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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_meal_items`
--

INSERT INTO `daily_meal_items` (`id`, `day`, `lunch_item`, `dinner_item`, `created_at`, `updated_at`) VALUES
(1, 'শনিবার', 'মুরগীর মাংস, সবজি, ডাল, আলু ভর্তা', 'বড় মাছ, শাকসবজি, ডাল', '2022-02-07 15:58:34', '2022-02-07 10:05:13'),
(2, 'রবিবার', 'বড় মাছ, সবজি, ডাল', 'ছোট মাছ, ভর্তা, ডাল', '2022-02-07 15:58:41', '2022-02-07 15:58:43'),
(3, 'সোমবার', 'ডিম, ভর্তা, ডাল', 'বড় মাছ, সবজি, ডাল', '2022-02-07 15:58:45', '2022-02-07 15:58:46'),
(4, 'মঙ্গলবার', 'মুরগীর মাংস, সবজি, ডাল', 'মলা মাছ ভর্তা, ডাল', '2022-02-07 15:58:47', '2022-02-07 15:58:48'),
(5, 'বুধবার', 'বড় মাছ, শাক-সবজি, ডাল', 'বড় মাছ, আলু ভর্তা, ডাল', '2022-02-07 15:58:49', '2022-02-07 15:58:50'),
(6, 'বৃহস্পতিবার', 'ছোট মাছ, ভর্তা, ডাল', 'ভুনা খিচুড়ি, সবজি, ডাল', '2022-02-07 15:58:51', '2022-02-07 15:58:52'),
(7, 'শুক্রবার', 'গরুর মাংস, সবজি, ডাল', 'ডিম, শাক, ডাল', '2022-02-07 15:58:54', '2022-02-12 13:59:06');

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
  `reset_token_hash` char(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_otp_verification`
--

-- One-time authentication codes are intentionally omitted from the demo dump.

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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meal_rates`
--

INSERT INTO `meal_rates` (`id`, `lunch_expiry_time`, `dinner_expiry_time`, `lunch_rate`, `lunch_rate_bangla`, `dinner_rate`, `dinner_rate_bangla`, `total_rate`, `created_at`, `updated_at`) VALUES
(1, 'বিকেল ৩টা ৩০মিনিট', 'রাত ১০টা ৩০মিনিট', 60, '৬০টাকা', 50, '৫০টাকা', 110, '2022-02-12 18:22:32', '2022-02-12 19:07:48');

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
(36, '2026_11_18_000003_remove_unmatched_demo_payment_snapshots', 18);

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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monthly_statements`
--

INSERT INTO `monthly_statements` (`id`, `year`, `month`, `token_no`, `total_lunch`, `lunch_cost`, `total_dinner`, `dinner_cost`, `total_meal`, `total_cost`, `total_payment`, `give`, `take`, `created_at`, `updated_at`) VALUES
(3, 2022, 'January', 100004, 2, 120, 2, 100, 4, 220, 220.00, 0.00, 0.00, NULL, NULL),
(4, 2022, 'February', 100004, 11, 660, 10, 500, 21, 1160, 1000.00, 160.00, 0.00, NULL, NULL),
(5, 2022, 'February', 100010, 9, 540, 8, 400, 17, 940, 500.00, 440.00, 0.00, NULL, NULL),
(6, 2022, 'February', 100009, 1, 60, 1, 50, 2, 110, 0.00, 110.00, 0.00, NULL, NULL),
(7, 2022, 'March', 100004, 4, 240, 4, 200, 8, 450, 4402.00, 0.00, 3952.00, NULL, NULL),
(8, 2022, 'March', 100009, 1, 60, 1, 50, 2, 110, 0.00, 110.00, 0.00, NULL, NULL),
(9, 2022, 'October', 100004, 2, 120, 3, 150, 5, 290, 4000.00, 0.00, 3710.00, NULL, NULL);

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
  `create_time` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `author_id`, `author_name`, `msg_title`, `msg_body`, `create_date`, `create_time`) VALUES
(5, 1, 'Demo Admin', 'Demo canteen update', 'This is a demo notification.', '2022-01-16', '09:44:45pm'),
(16, 1, 'Demo Admin', 'Demo meal schedule', 'This is a demo notification.', '2022-02-14', '02:04:25am'),
(20, 1, 'Demo Admin', 'Demo service update', 'This is a demo notification.', '2022-10-13', '12:01:55pm'),
(21, 4, 'Demo Member 1', 'Demo meal request', 'This is a demo meal request.', '2022-10-13', '12:17:44pm');

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
  `create_time` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_details`
--

INSERT INTO `notification_details` (`id`, `notification_id`, `user_id`, `status`, `create_date`, `create_time`) VALUES
(3, 5, 4, 'Latest', '2022-01-16', '09:44:45pm'),
(4, 5, 9, 'Latest', '2022-01-16', '09:44:45pm'),
(5, 5, 10, 'Latest', '2022-01-16', '09:44:45pm'),
(19, 16, 4, 'Latest', '2022-02-14', '02:04:25am'),
(20, 16, 9, 'Latest', '2022-02-14', '02:04:25am'),
(21, 16, 10, 'Latest', '2022-02-14', '02:04:25am'),
(29, 20, 4, 'Latest', '2022-10-13', '12:01:55pm'),
(30, 20, 9, 'Latest', '2022-10-13', '12:01:55pm'),
(31, 20, 10, 'Latest', '2022-10-13', '12:01:55pm'),
(32, 20, 11, 'Latest', '2022-10-13', '12:01:55pm'),
(33, 21, 1, 'Latest', '2022-10-13', '12:17:44pm');

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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_meals`
--

INSERT INTO `order_meals` (`id`, `user_id`, `token_no`, `lunch`, `lunch_amount`, `dinner`, `dinner_amount`, `total_meal`, `delivery_charge`, `total_amount`, `is_parcel`, `status`, `notes`, `meal_given_date`, `deleted_at`, `created_at`, `updated_at`) VALUES
(32, 4, 100004, 5, 300, 5, 250, 10, 0.00, 550, 'No', 'Completed', NULL, '2022-02-08', NULL, '2022-02-07 15:48:02', '2022-02-07 15:48:02'),
(33, 10, 100010, 5, 300, 5, 250, 10, 0.00, 550, 'No', 'Completed', NULL, '2022-02-08', NULL, '2022-02-07 15:54:23', '2022-02-07 15:54:23'),
(35, 10, 100010, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-12', NULL, '2022-02-11 15:50:00', '2022-02-11 15:50:00'),
(38, 4, 100004, 2, 120, 2, 100, 4, 0.00, 220, 'No', 'Completed', NULL, '2022-02-14', NULL, '2022-02-13 10:29:23', '2022-02-13 04:30:17'),
(41, 4, 100004, 2, 120, 1, 50, 3, 0.00, 170, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 18:41:30', '2022-02-13 13:19:49'),
(42, 10, 100010, 3, 180, 2, 100, 5, 0.00, 280, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 19:07:36', '2022-02-13 13:20:34'),
(43, 9, 100009, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-15', NULL, '2022-02-13 19:07:57', '2022-02-13 13:20:28'),
(44, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-21', NULL, '2022-02-20 14:52:51', '2022-02-20 14:52:51'),
(45, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-02-22', NULL, '2022-02-21 14:52:13', '2022-02-21 14:52:13'),
(49, 9, 100009, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Completed', NULL, '2022-03-22', NULL, '2022-03-17 21:53:23', '2022-03-17 15:53:46'),
(50, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Pending', NULL, '2022-03-22', NULL, '2022-03-17 22:50:39', '2022-03-23 09:44:00'),
(51, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'Yes', 'Completed', NULL, '2022-03-22', NULL, '2022-03-19 18:42:55', '2022-10-12 09:36:08'),
(52, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'Yes', 'Completed', NULL, '2022-03-23', NULL, '2022-03-22 17:53:15', '2022-03-22 16:45:44'),
(99, 4, 100004, 1, 60, 1, 50, 2, 0.00, 110, 'No', 'Processing', NULL, '2022-03-24', '2022-03-23 09:15:31', '2022-03-22 21:31:18', '2022-03-23 09:15:31'),
(100, 4, 100004, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Completed', NULL, '2022-03-24', NULL, '2022-03-23 15:19:10', '2022-03-23 09:20:17'),
(101, 4, 100004, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Processing', NULL, '2022-10-08', NULL, '2022-10-07 17:03:26', '2022-10-07 11:03:33'),
(102, 4, 100004, 1, 60, 1, 50, 2, 10.00, 120, 'Yes', 'Processing', NULL, '2022-10-13', '2022-10-12 09:50:02', '2022-10-12 14:50:32', '2022-10-12 09:50:02'),
(103, 4, 100004, 1, 60, 2, 100, 3, 10.00, 170, 'Yes', 'Processing', NULL, '2022-10-13', NULL, '2022-10-12 15:50:16', '2022-10-12 09:50:24');

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
  `payment_time` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `year`, `month`, `name`, `token_no`, `email`, `phone`, `amount`, `address`, `transaction_id`, `status`, `currency`, `payment_date`, `payment_time`) VALUES
(11, 2022, 'February', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 500.00, 'Demo Address 1', 'DEMO-TXN-11', 'Completed', 'BDT', '2022-02-07', '09:52:59pm'),
(12, 2022, 'February', 'Demo Member 3', 100010, 'member3@example.invalid', '00000000010', 400.00, 'Demo Address 3', 'DEMO-TXN-12', 'Completed', 'BDT', '2022-02-07', '09:54:43pm'),
(18, 2022, 'February', 'Demo Member 3', 100010, 'member3@example.invalid', '00000000010', 100.00, 'Demo Address 3', 'DEMO-TXN-18', 'Completed', 'BDT', '2022-02-18', '09:21:36pm'),
(20, 2022, 'February', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 500.00, 'Demo Address 1', 'DEMO-TXN-20', 'Processing', 'BDT', '2022-02-21', '10:06:01pm'),
(22, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-22', 'Canceled', 'BDT', '2022-03-20', '12:45:20am'),
(23, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 100.50, 'Demo Address 1', 'DEMO-TXN-23', 'Pending', 'BDT', '2022-03-23', '09:21:25pm'),
(26, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 100.50, 'Demo Address 1', 'DEMO-TXN-26', 'Pending', 'BDT', '2022-03-23', '09:22:29pm'),
(27, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 100.50, 'Demo Address 1', 'DEMO-TXN-27', 'Pending', 'BDT', '2022-03-23', '09:23:21pm'),
(28, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 100.50, 'Demo Address 1', 'DEMO-TXN-28', 'Pending', 'BDT', '2022-03-23', '09:24:15pm'),
(29, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-29', 'Pending', 'BDT', '2022-03-23', '09:27:56pm'),
(30, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-30', 'Pending', 'BDT', '2022-03-23', '09:29:14pm'),
(31, 2022, 'March', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-31', 'Pending', 'BDT', '2022-03-23', '09:29:33pm'),
(33, 2022, 'September', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-33', 'Completed', 'BDT', '2022-10-07', '11:06:30pm'),
(34, 2022, 'October', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-34', 'Processing', 'BDT', '2022-10-07', '11:09:50pm'),
(35, 2022, 'October', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-35', 'Processing', 'BDT', '2022-10-12', '09:25:30pm'),
(36, 2022, 'October', 'Demo Member 1', 100004, 'member1@example.invalid', '00000000004', 1000.00, 'Demo Address 1', 'DEMO-TXN-36', 'Processing', 'BDT', '2022-10-13', '12:04:12pm');

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

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
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

INSERT INTO `users` (`id`, `token_no`, `name`, `username`, `email`, `phone`, `role`, `status`, `password`, `address`, `photo`, `created_at`, `updated_at`) VALUES
-- Password placeholders are intentionally unusable; create test credentials locally.
(1, 100001, 'Demo Admin', 'demo-admin', 'admin@example.invalid', '00000000001', 'admin', 'active', '!', 'Demo Address', NULL, '2022-01-09 09:42:41', '2022-03-19 13:43:12'),
(4, 100004, 'Demo Member 1', 'demo-member-1', 'member1@example.invalid', '00000000004', 'user', 'active', '!', 'Demo Address 1', NULL, '2022-01-09 09:42:41', '2022-10-12 09:29:46'),
(9, 100009, 'Demo Member 2', 'demo-member-2', 'member2@example.invalid', '00000000009', 'user', 'active', '!', 'Demo Address 2', NULL, '2022-02-06 10:42:12', '2022-02-20 09:40:08'),
(10, 100010, 'Demo Member 3', 'demo-member-3', 'member3@example.invalid', '00000000010', 'user', 'inactive', '!', 'Demo Address 3', NULL, '2022-02-06 11:28:12', '2022-02-20 09:44:24'),
(11, 100011, 'Demo Member 4', 'demo-member-4', 'member4@example.invalid', '00000000011', 'user', 'active', '!', 'Demo Address 4', NULL, '2022-02-16 09:17:49', '2022-02-16 13:13:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_profile`
--
ALTER TABLE `admin_profile`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `daily_bazar_costs`
--
ALTER TABLE `daily_bazar_costs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `daily_bazar_costs_date_unique` (`date`);

--
-- Indexes for table `daily_meal_items`
--
ALTER TABLE `daily_meal_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `daily_meal_items_day_unique` (`day`);

--
-- Indexes for table `email_otp_verification`
--
ALTER TABLE `email_otp_verification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `otp_email_expiry_index` (`email`,`expires_at`),
  ADD KEY `otp_reset_token_hash_index` (`reset_token_hash`);

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
  ADD PRIMARY KEY (`id`);

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
  ADD UNIQUE KEY `statements_token_period_unique` (`token_no`,`year`,`month`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_author_id_id_index` (`author_id`,`id`);

--
-- Indexes for table `notification_details`
--
ALTER TABLE `notification_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_recipients_unique` (`notification_id`,`user_id`),
  ADD KEY `notification_user_item_index` (`user_id`,`notification_id`),
  ADD KEY `notification_user_status_index` (`user_id`,`status`),
  ADD KEY `notification_user_recent_index` (`user_id`,`id`,`notification_id`);

--
-- Indexes for table `order_meals`
--
ALTER TABLE `order_meals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orders_user_date_index` (`user_id`,`meal_given_date`),
  ADD KEY `orders_token_date_index` (`token_no`,`meal_given_date`),
  ADD KEY `orders_meal_date_deleted_index` (`meal_given_date`,`deleted_at`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_transaction_id_unique` (`transaction_id`),
  ADD KEY `payments_token_date_index` (`token_no`,`payment_date`),
  ADD KEY `payments_date_id_index` (`payment_date`,`id`),
  ADD KEY `payments_token_period_amount_index` (`token_no`,`year`,`month`,`amount`),
  ADD KEY `payments_date_token_amount_index` (`payment_date`,`token_no`,`amount`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_token_no_unique` (`token_no`),
  ADD KEY `users_role_status_index` (`role`,`status`),
  ADD KEY `users_role_id_index` (`role`,`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_profile`
--
ALTER TABLE `admin_profile`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `daily_bazar_costs`
--
ALTER TABLE `daily_bazar_costs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `daily_meal_items`
--
ALTER TABLE `daily_meal_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_author_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_details`
--
ALTER TABLE `notification_details`
  ADD CONSTRAINT `notification_details_notification_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_details_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_meals`
--
ALTER TABLE `order_meals`
  ADD CONSTRAINT `order_meals_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
