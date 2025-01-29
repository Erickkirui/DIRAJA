# Inventory Model Documentation

## Table of Contents

* [1. Overview](#1-overview)
* [2. Database Table Schema](#2-database-table-schema)
* [3. `generate_batch_code` Static Method](#3-generate_batch_code-static-method)
* [4. `__repr__` Method](#4-repr-method)


## 1. Overview

This document details the `Inventory` model within the application's database.  The model is responsible for storing information about inventory items, including their quantity, cost, supplier details, and batch numbers.  It utilizes Flask-SQLAlchemy for database interaction.


## 2. Database Table Schema

The `Inventory` model maps to the `inventory` table in the database. The table schema is defined as follows:

| Column Name        | Data Type    | Constraints                               | Description                                      |
|---------------------|---------------|-------------------------------------------|--------------------------------------------------|
| `inventory_id`     | `Integer`     | `primary_key`, `autoincrement`           | Unique identifier for each inventory item.       |
| `itemname`          | `String(50)`  | `nullable=False`                          | Name of the inventory item.                      |
| `initial_quantity` | `Integer`     |                                           | Initial quantity of the item when added to inventory. |
| `quantity`          | `Float`       | `nullable=False`                          | Current quantity of the item.                    |
| `metric`            | `String(50)`  |                                           | Unit of measurement (e.g., kg, liters, units). |
| `unitCost`          | `Float`       | `nullable=False`                          | Cost per unit.                                  |
| `totalCost`         | `Float`       | `nullable=False`                          | Total cost of the item.                         |
| `amountPaid`        | `Float`       | `nullable=False`                          | Amount paid for the item.                        |
| `unitPrice`         | `Float`       | `nullable=False`                          | Selling price per unit.                         |
| `BatchNumber`       | `String(50)`  | `nullable=False`                          | Batch number of the item.                       |
| `user_id`           | `Integer`     | `db.ForeignKey('users.users_id')`       | Foreign key referencing the user who added the item. |
| `Suppliername`      | `String(50)`  | `nullable=False`                          | Name of the supplier.                           |
| `Supplier_location` | `String(50)`  | `nullable=False`                          | Location of the supplier.                       |
| `ballance`          | `Float`       |                                           | Balance (likely related to quantity or cost).    |
| `note`              | `String(50)`  |                                           | Any additional notes.                            |
| `created_at`       | `DateTime`    | `server_default=db.func.now()`           | Timestamp indicating when the record was created. |


## 3. `generate_batch_code` Static Method

This static method generates a unique batch code for each inventory item. The algorithm incorporates several data points to ensure uniqueness:

1. **Date Extraction:** The `created_at` datetime object is parsed to extract the year (last two digits), month (two digits), and day (two digits).

2. **Data Sanitization:** The `itemname`, `Suppliername`, and `Supplier_location` are converted to uppercase and spaces are removed to create concise codes.

3. **Batch Number Processing:** The input `batch_number` (integer) is used to determine a letter from the alphabet (A-Z) that changes every 100 batch numbers.  This ensures that the letter cycles through the alphabet. The `display_batch_number` is adjusted to display the batch number in a 1-100 range for each letter.

4. **Code Construction:** The final batch code is formatted as:  `SUPPLIERNAME-SUPPLIERLOCATION-ITEM-YYMMDD-LN`, where:
    * `SUPPLIERNAME`, `SUPPLIERLOCATION`, and `ITEM` are the sanitized codes.
    * `YYMMDD` represents the year, month, and day.
    * `L` is the letter calculated from the batch number.
    * `N` is the adjusted batch number (1-100).


**Example:**

Let's assume:

* `Suppliername` = "Acme Corp"
* `Supplier_location` = "New York"
* `itemname` = "Widget X"
* `created_at` = "2024-03-15"
* `batch_number` = 153

The method would generate the following batch code:

1. **Year:** 24
2. **Month:** 03
3. **Day:** 15
4. **item_code:** WIDGETX
5. **supplier_name_code:** ACMECORP
6. **supplier_location_code:** NEWYORK
7. **batch_letter:** B (because (153 - 1) // 100 = 1, and letters[1 % 26] = 'B')
8. **display_batch_number:** 154

Therefore, the resulting `batch_code` would be: `ACMECORP-NEWYORK-WIDGETX-240315-B154`


## 4. `__repr__` Method

This method provides a string representation of the `Inventory` object, useful for debugging and logging. It returns a string in the format:  `Inventory(id=..., itemname='...', quantity=..., BatchNumber='...')`.
