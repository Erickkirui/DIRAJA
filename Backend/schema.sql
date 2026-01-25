-- MySQL dump 10.13  Distrib 8.4.7, for Linux (x86_64)
--
-- Host: localhost    Database: Diraja
-- ------------------------------------------------------
-- Server version	8.4.7-0ubuntu0.25.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `LiveStock`
--

DROP TABLE IF EXISTS `LiveStock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LiveStock` (
  `id` int NOT NULL,
  `shop_id` int NOT NULL,
  `item_name` varchar(30) NOT NULL,
  `metric` varchar(50) DEFAULT NULL,
  `clock_in_quantity` float NOT NULL,
  `added_stock` float DEFAULT '0',
  `current_quantity` float NOT NULL,
  `mismatch_quantity` float DEFAULT '0',
  `mismatch_reason` varchar(255) DEFAULT NULL,
  `clock_out_quantity` float NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `LiveStock_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shops_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `account_type`
--

DROP TABLE IF EXISTS `account_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank`
--

DROP TABLE IF EXISTS `bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank` (
  `bank_id` int NOT NULL,
  `sales_id` int DEFAULT NULL,
  `bankname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `accountnumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `bankname` (`bankname`),
  CONSTRAINT `bank_chk_1` CHECK (json_valid(`accountnumber`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank_account`
--

DROP TABLE IF EXISTS `bank_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_account` (
  `id` int NOT NULL,
  `Account_name` varchar(50) NOT NULL,
  `Account_Balance` float NOT NULL,
  `chart_account_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banking_transaction`
--

DROP TABLE IF EXISTS `banking_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banking_transaction` (
  `id` bigint unsigned NOT NULL,
  `account_id` int NOT NULL,
  `Transaction_type_credit` float DEFAULT NULL,
  `Transaction_type_debit` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cash_deposits`
--

DROP TABLE IF EXISTS `cash_deposits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_deposits` (
  `deposit_id` int NOT NULL,
  `user_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `amount` float NOT NULL,
  `deductions` float DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transaction_code` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chart_of_accounts`
--

DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts` (
  `id` int NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cooked_items`
--

DROP TABLE IF EXISTS `cooked_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cooked_items` (
  `id` int NOT NULL,
  `shop_id` int NOT NULL,
  `from_itemname` varchar(255) NOT NULL,
  `to_itemname` varchar(255) NOT NULL,
  `quantity_moved` float NOT NULL,
  `unit_cost` float DEFAULT NULL,
  `total_cost` float DEFAULT NULL,
  `performed_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `creditors`
--

DROP TABLE IF EXISTS `creditors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `creditors` (
  `id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `shop_id` int NOT NULL,
  `total_credit` float DEFAULT '0',
  `credit_amount` float DEFAULT '0',
  `phone_number` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` int NOT NULL,
  `customer_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `customer_number` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `sales_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `item` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `amount_paid` float NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `surname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `phone_number` int NOT NULL,
  `work_email` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `account_status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `shop_id` int DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `personal_email` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `designation` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_of_birth` datetime DEFAULT NULL,
  `national_id_number` int DEFAULT NULL,
  `kra_pin` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `monthly_gross_salary` float DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bank_account_number` int DEFAULT NULL,
  `bank_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `department` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `starting_date` datetime DEFAULT NULL,
  `contract_termination_date` datetime DEFAULT NULL,
  `contract_renewal_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `merit_points` int NOT NULL DEFAULT '100',
  `merit_points_updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employeesLoan`
--

DROP TABLE IF EXISTS `employeesLoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeesLoan` (
  `loan_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `loan` float NOT NULL,
  `wallet_ballance` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_category`
--

DROP TABLE IF EXISTS `expense_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_category` (
  `id` int NOT NULL,
  `category_name` varchar(150) NOT NULL,
  `type` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `expense_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `item` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` float DEFAULT NULL,
  `paidTo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `totalPrice` float NOT NULL,
  `amountPaid` float NOT NULL,
  `created_at` datetime NOT NULL,
  `source` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `comments` text COLLATE utf8mb4_general_ci,
  `paymentRef` varchar(100) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` int NOT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `initial_quantity` float DEFAULT NULL,
  `quantity` float NOT NULL,
  `metric` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `unitCost` float NOT NULL,
  `totalCost` float NOT NULL,
  `amountPaid` float NOT NULL,
  `unitPrice` float NOT NULL,
  `BatchNumber` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `Suppliername` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `Supplier_location` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `ballance` float DEFAULT NULL,
  `note` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `source` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `paymentRef` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `Trasnaction_type_credit` float NOT NULL,
  `Transcation_type_debit` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventoryV2`
--

DROP TABLE IF EXISTS `inventoryV2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventoryV2` (
  `inventoryV2_id` int NOT NULL,
  `itemname` varchar(50) NOT NULL,
  `initial_quantity` float DEFAULT NULL,
  `quantity` float NOT NULL,
  `metric` varchar(50) DEFAULT NULL,
  `unitCost` float NOT NULL,
  `totalCost` float NOT NULL,
  `amountPaid` float NOT NULL,
  `unitPrice` float DEFAULT NULL,
  `BatchNumber` varchar(300) NOT NULL,
  `user_id` int DEFAULT NULL,
  `Trasnaction_type_credit` float NOT NULL,
  `Transcation_type_debit` float NOT NULL,
  `paymentRef` varchar(255) NOT NULL,
  `Suppliername` varchar(50) NOT NULL,
  `Supplier_location` varchar(50) NOT NULL,
  `ballance` float DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `source` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item_chart_assoc`
--

DROP TABLE IF EXISTS `item_chart_assoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_chart_assoc` (
  `item_account_id` int NOT NULL,
  `chart_account_id` int NOT NULL,
  PRIMARY KEY (`item_account_id`,`chart_account_id`),
  KEY `chart_account_id` (`chart_account_id`),
  CONSTRAINT `item_chart_assoc_ibfk_1` FOREIGN KEY (`chart_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `item_chart_assoc_ibfk_2` FOREIGN KEY (`item_account_id`) REFERENCES `item_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items_list`
--

DROP TABLE IF EXISTS `items_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items_list` (
  `item_id` bigint unsigned NOT NULL,
  `item_type` varchar(50) NOT NULL,
  `item_name` varchar(50) DEFAULT NULL,
  `purchase_account` int DEFAULT NULL,
  `sales_account` int DEFAULT NULL,
  `cost_of_sales_account` int DEFAULT NULL,
  `gl_account_id` int DEFAULT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mabandaexpense`
--

DROP TABLE IF EXISTS `mabandaexpense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mabandaexpense` (
  `mabandaexpense_id` int NOT NULL,
  `description` varchar(200) NOT NULL,
  `amount` float NOT NULL,
  `expense_date` date NOT NULL,
  `shop_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mabandapurchase`
--

DROP TABLE IF EXISTS `mabandapurchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mabandapurchase` (
  `mabandapurchase_id` int NOT NULL,
  `itemname` varchar(100) NOT NULL,
  `quantity` varchar(100) NOT NULL,
  `price` float DEFAULT NULL,
  `purchase_date` date NOT NULL,
  `shop_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mabandasale`
--

DROP TABLE IF EXISTS `mabandasale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mabandasale` (
  `mabandasale_id` int NOT NULL,
  `itemname` varchar(100) NOT NULL,
  `quantity_sold` varchar(100) NOT NULL,
  `amount_paid` float NOT NULL,
  `sale_date` date NOT NULL,
  `shop_id` int NOT NULL,
  `mode_of_payment` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mabandastock`
--

DROP TABLE IF EXISTS `mabandastock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mabandastock` (
  `mabandastock_id` int NOT NULL,
  `itemname` varchar(100) NOT NULL,
  `quantity` varchar(100) NOT NULL,
  `price` float DEFAULT NULL,
  `date_added` date NOT NULL,
  `shop_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `merit_ledger`
--

DROP TABLE IF EXISTS `merit_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merit_ledger` (
  `meritledger_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `merit_id` int NOT NULL,
  `comment` varchar(255) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resulting_points` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `merit_points`
--

DROP TABLE IF EXISTS `merit_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merit_points` (
  `meritpoint_id` int NOT NULL,
  `reason` varchar(255) NOT NULL,
  `point` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `Dashboard` tinyint(1) DEFAULT '0',
  `Stock` tinyint(1) DEFAULT '0',
  `Sales` tinyint(1) DEFAULT '0',
  `Sales_analytics` tinyint(1) DEFAULT '0',
  `Expenses` tinyint(1) DEFAULT '0',
  `Mabanda_Farm` tinyint(1) DEFAULT '0',
  `Shops` tinyint(1) DEFAULT '0',
  `Employess` tinyint(1) DEFAULT '0',
  `Suppliers` tinyint(1) DEFAULT '0',
  `Creditors` tinyint(1) DEFAULT '0',
  `Task_manager` tinyint(1) DEFAULT '0',
  `Accounting` tinyint(1) DEFAULT '0',
  `Settings` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `push_subscription`
--

DROP TABLE IF EXISTS `push_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscription` (
  `id` int NOT NULL,
  `shop_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `endpoint` varchar(512) NOT NULL,
  `p256dh` varchar(256) NOT NULL,
  `auth` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `sales_id` int NOT NULL,
  `user_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `customer_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_number` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `balance` float DEFAULT NULL,
  `note` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promocode` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `delivery` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_department`
--

DROP TABLE IF EXISTS `sales_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_department` (
  `departemntsale_id` int NOT NULL,
  `user_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `item_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `shop_sale_name` varchar(50) NOT NULL,
  `customer_name` varchar(50) DEFAULT NULL,
  `customer_number` varchar(15) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `total_price` float DEFAULT NULL,
  CONSTRAINT `sales_department_chk_1` CHECK (json_valid(`item_name`))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_payment_methods`
--

DROP TABLE IF EXISTS `sales_payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_payment_methods` (
  `id` int NOT NULL,
  `sale_id` int NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `amount_paid` float NOT NULL,
  `balance` float DEFAULT NULL,
  `transaction_code` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `discount` float DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_stock`
--

DROP TABLE IF EXISTS `shop_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_stock` (
  `stock_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `transfer_id` int DEFAULT NULL,
  `total_cost` float NOT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `metric` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `inventory_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `BatchNumber` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `unitPrice` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_stock_v2`
--

DROP TABLE IF EXISTS `shop_stock_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_stock_v2` (
  `stockv2_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `transferv2_id` int DEFAULT NULL,
  `total_cost` float DEFAULT NULL,
  `itemname` varchar(50) NOT NULL,
  `metric` varchar(50) DEFAULT NULL,
  `inventoryv2_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `BatchNumber` varchar(300) NOT NULL,
  `unitPrice` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_targets`
--

DROP TABLE IF EXISTS `shop_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_targets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `assigned_by_user_id` int NOT NULL,
  `assigned_by_name` varchar(100) NOT NULL,
  `target_type` enum('daily','weekly','monthly') NOT NULL,
  `target_amount` float NOT NULL,
  `current_sales` float NOT NULL DEFAULT '0',
  `status` enum('achieved','not_achieved') NOT NULL DEFAULT 'not_achieved',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_shop` (`shop_id`),
  KEY `fk_user` (`assigned_by_user_id`),
  CONSTRAINT `fk_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shops_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `shops_id` int NOT NULL,
  `shopname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `location` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `employee` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `shopstatus` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `report_status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`shops_id`),
  CONSTRAINT `shops_chk_1` CHECK (json_valid(`employee`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shoptoshop_transfer`
--

DROP TABLE IF EXISTS `shoptoshop_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shoptoshop_transfer` (
  `transfer_id` int NOT NULL,
  `shops_id` int DEFAULT NULL,
  `from_shop_id` int NOT NULL,
  `to_shop_id` int NOT NULL,
  `users_id` int NOT NULL,
  `stockv2_id` int NOT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` float NOT NULL,
  `transfer_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `metric` varchar(20) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shoptransfers`
--

DROP TABLE IF EXISTS `shoptransfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shoptransfers` (
  `id` int NOT NULL,
  `shop_id` int NOT NULL,
  `item_name` varchar(30) NOT NULL,
  `quantity` float NOT NULL,
  `metric` varchar(50) DEFAULT NULL,
  `fromshop` varchar(255) DEFAULT NULL,
  `toshop` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sold_items`
--

DROP TABLE IF EXISTS `sold_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sold_items` (
  `id` bigint unsigned NOT NULL,
  `sales_id` int NOT NULL,
  `item_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` float NOT NULL,
  `metric` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `unit_price` float NOT NULL,
  `total_price` float NOT NULL,
  `BatchNumber` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `stock_id` int DEFAULT NULL,
  `Cost_of_sale` float NOT NULL,
  `Purchase_account` float NOT NULL,
  `LivestockDeduction` float DEFAULT '0',
  `stockv2_id` int NOT NULL,
  `round_off` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spoilt`
--

DROP TABLE IF EXISTS `spoilt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spoilt` (
  `id` int NOT NULL,
  `clerk_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `item` varchar(50) NOT NULL,
  `quantity` float DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `disposal_method` varchar(100) DEFAULT NULL,
  `collector_name` varchar(100) DEFAULT NULL,
  `comment` varchar(10000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `batches_affected` varchar(1000) DEFAULT NULL,
  `livestock_deduction` float DEFAULT '0',
  `inventory_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `stock_id` int NOT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `shop_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `metric` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `unitCost` float NOT NULL,
  `totalCost` float NOT NULL,
  `amountPaid` float NOT NULL,
  `unitPrice` float NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_item`
--

DROP TABLE IF EXISTS `stock_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_item` (
  `id` bigint unsigned NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `item_code` varchar(150) DEFAULT NULL,
  `unit_price` float DEFAULT NULL,
  `pack_price` float DEFAULT NULL,
  `pack_quantity` int DEFAULT NULL,
  `category` enum('eggs','chicken','farmers choice','others') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_reconciliation`
--

DROP TABLE IF EXISTS `stock_reconciliation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reconciliation` (
  `id` int NOT NULL,
  `shop_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `stock_value` float NOT NULL,
  `report_value` float NOT NULL,
  `item` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `difference` float NOT NULL,
  `status` enum('Solved','Unsolved') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Unsolved',
  `comment` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_reports`
--

DROP TABLE IF EXISTS `stock_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reports` (
  `id` int NOT NULL,
  `shop_id` int NOT NULL,
  `user_id` int NOT NULL,
  `report` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `comment` text,
  `reported_at` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `stock_reports_chk_1` CHECK (json_valid(`report`))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_returnv2`
--

DROP TABLE IF EXISTS `stock_returnv2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_returnv2` (
  `returnv2_id` int NOT NULL,
  `stockv2_id` int DEFAULT NULL,
  `inventoryv2_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `returned_by` int DEFAULT NULL,
  `return_date` datetime NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `reviewed_by` int DEFAULT NULL,
  `review_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_history`
--

DROP TABLE IF EXISTS `supplier_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_history` (
  `history_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `amount_received` float NOT NULL,
  `transaction_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `item_bought` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_location` varchar(255) NOT NULL,
  `total_amount_received` float DEFAULT '0',
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(50) NOT NULL,
  `items_sold` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  CONSTRAINT `suppliers_chk_1` CHECK (json_valid(`items_sold`))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_stock_transfer`
--

DROP TABLE IF EXISTS `system_stock_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_stock_transfer` (
  `transfer_id` int NOT NULL,
  `shops_id` int NOT NULL,
  `from_shop_id` int NOT NULL,
  `to_shop_id` int NOT NULL,
  `users_id` int NOT NULL,
  `itemname` varchar(50) NOT NULL,
  `inventory_id` int NOT NULL,
  `quantity` float NOT NULL,
  `batch_number` varchar(50) NOT NULL,
  `transfer_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_cost` float NOT NULL,
  `unit_price` float NOT NULL,
  PRIMARY KEY (`transfer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_manager`
--

DROP TABLE IF EXISTS `task_manager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_manager` (
  `task_id` bigint unsigned NOT NULL,
  `user_id` int NOT NULL,
  `assignee_id` int NOT NULL,
  `task` varchar(255) NOT NULL,
  `assigned_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` timestamp NULL DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `priority` varchar(50) NOT NULL,
  `closing_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `id` int NOT NULL,
  `Transaction_type` varchar(50) NOT NULL,
  `Transaction_amount` float NOT NULL,
  `From_account` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `To_account` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `transfer_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `inventory_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `total_cost` float NOT NULL,
  `BatchNumber` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `metric` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `amountPaid` float NOT NULL,
  `unitCost` float NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transfers_v2`
--

DROP TABLE IF EXISTS `transfers_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers_v2` (
  `transferv2_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `inventoryV2_id` int DEFAULT NULL,
  `quantity` float NOT NULL,
  `received_quantity` float NOT NULL DEFAULT '0',
  `difference` float NOT NULL DEFAULT '0',
  `total_cost` float NOT NULL,
  `BatchNumber` varchar(300) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `itemname` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `metric` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `amountPaid` float DEFAULT NULL,
  `unitCost` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Received','Not Received','Declined') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Not Received'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `users_id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `employee_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-18 21:04:20
