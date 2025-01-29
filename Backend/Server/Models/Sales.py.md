# Internal Code Documentation: Sales and Payment Models

## Table of Contents

* [1. Sales Model](#1-sales-model)
    * [1.1 Table Columns](#11-table-columns)
    * [1.2 Relationships](#12-relationships)
    * [1.3 Validations](#13-validations)
    * [1.4 `__repr__` Method](#14-repr-method)
* [2. SalesPaymentMethods Model](#2-salespaymentmethods-model)
    * [2.1 Table Columns](#21-table-columns)
    * [2.2 Relationships](#22-relationships)
    * [2.3 Validations](#23-validations)
    * [2.4 `__repr__` Method](#24-repr-method)


## 1. Sales Model

This model represents a sales transaction within the system.  It stores information about the sale, including customer details, items sold, and payment status.

### 1.1 Table Columns

| Column Name        | Data Type | Constraints                               | Description                                                                 |
|--------------------|------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `sales_id`         | `db.Integer` | `primary_key`, `autoincrement`          | Unique identifier for each sale.                                             |
| `user_id`          | `db.Integer` | `db.ForeignKey('users.users_id')`, `nullable=False` | Foreign key referencing the `users` table, indicating the sales representative. |
| `shop_id`          | `db.Integer` | `db.ForeignKey('shops.shops_id')`, `nullable=False` | Foreign key referencing the `shops` table, indicating the shop where the sale occurred. |
| `customer_name`    | `db.String(50)` | `nullable=True`                         | Name of the customer.                                                       |
| `status`           | `db.String(50)` | `default="unpaid"`, `nullable=False`    | Status of the sale (e.g., "paid", "unpaid", "partially_paid").             |
| `customer_number`  | `db.String(15)` | `nullable=True`                         | Customer's phone number or other identifier.                               |
| `item_name`        | `db.String(50)` | `nullable=False`                        | Name of the item sold.                                                      |
| `quantity`         | `db.Float`   | `nullable=False`                        | Quantity of the item sold.                                                  |
| `metric`           | `db.String(10)` | `nullable=False`                        | Unit of measurement (e.g., "item", "kg", "ltrs").                         |
| `unit_price`       | `db.Float`   | `nullable=False`                        | Price per unit of the item.                                                 |
| `total_price`      | `db.Float`   | `nullable=False`                        | Total price of the sale.                                                    |
| `BatchNumber`      | `db.String(50)` | `nullable=False`                        | Batch number of the item sold.                                              |
| `created_at`       | `db.DateTime` | `nullable=False`                        | Timestamp indicating when the sale was recorded.                            |
| `stock_id`         | `db.Integer` | `db.ForeignKey('shop_stock.stock_id')`, `nullable=False` | Foreign key referencing the `shop_stock` table, linking to the stock item sold.|
| `balance`          | `db.Float`   |                                           | Remaining balance if partially paid.                                          |
| `note`             | `db.String(50)` |                                           | Any additional notes about the sale.                                        |


### 1.2 Relationships

* **`payments`:** One-to-many relationship with the `SalesPaymentMethods` model.  Cascading delete-orphan ensures that if a sale is deleted, its associated payment records are also deleted.
* **`user`:** Many-to-one relationship with the `Users` model.
* **`shop`:** Many-to-one relationship with the `Shops` model.
* **`shop_stock`:** Many-to-one relationship with the `ShopStock` model.


### 1.3 Validations

The `Sales` model includes validations for the `status` and `metric` fields to ensure data integrity.  The `validate_status` method asserts that the `status` is one of "paid", "unpaid", or "partially_paid". Similarly, `validate_metric` restricts `metric` to "item", "kg", or "ltrs". The `validate_customer_number` method handles empty strings by setting the field to `None`.


### 1.4 `__repr__` Method

This method provides a string representation of the `Sales` object, useful for debugging and logging.


## 2. SalesPaymentMethods Model

This model tracks the payment methods used for each sale.

### 2.1 Table Columns

| Column Name      | Data Type | Constraints                | Description                                     |
|-----------------|------------|----------------------------|-------------------------------------------------|
| `id`             | `db.Integer` | `primary_key`, `autoincrement` | Unique identifier for each payment record.       |
| `sale_id`        | `db.Integer` | `db.ForeignKey('sales.sales_id')`, `nullable=False` | Foreign key referencing the `sales` table.       |
| `payment_method` | `db.String(50)` | `nullable=False`            | Method of payment (e.g., "bank", "cash", "mpesa"). |
| `amount_paid`    | `db.Float`   | `nullable=False`            | Amount paid using this method.                   |
| `balance`        | `db.Float`   | `nullable=True`             | Remaining balance after this payment.            |


### 2.2 Relationships

* **`sale`:** Many-to-one relationship with the `Sales` model.


### 2.3 Validations

The `validate_payment_method` method ensures that the `payment_method` is one of "bank", "cash", "mpesa", or "sasapay".


### 2.4 `__repr__` Method

This method provides a string representation of the `SalesPaymentMethods` object, useful for debugging and logging.

