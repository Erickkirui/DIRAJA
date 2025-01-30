# Internal Code Documentation: Expenses Model

## Table of Contents

* [1. Overview](#1-overview)
* [2. Class `Expenses`](#2-class-expenses)
    * [2.1 Table Columns](#21-table-columns)
    * [2.2 Relationships](#22-relationships)
    * [2.3 `__repr__` Method](#23-repr-method)


<a name="1-overview"></a>
## 1. Overview

This document details the `Expenses` model in the application's database schema.  The `Expenses` model is used to store information about expenses incurred by users, associating them with specific shops, items, and financial transactions.  The model leverages SQLAlchemy for database interaction.


<a name="2-class-expenses"></a>
## 2. Class `Expenses`

The `Expenses` class represents a database table named "expenses" and is defined using SQLAlchemy's declarative base.


<a name="21-table-columns"></a>
### 2.1 Table Columns

The table consists of the following columns:

| Column Name        | Data Type     | Constraints                               | Description                                                                 |
|---------------------|-----------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `expense_id`       | `db.Integer`   | `primary_key=True`, `autoincrement=True` | Unique identifier for each expense record. Auto-incrementing.              |
| `user_id`          | `db.Integer`   | `db.ForeignKey('users.users_id')`        | Foreign key referencing the `users` table, indicating the user who made the expense. |
| `shop_id`          | `db.Integer`   | `db.ForeignKey('shops.shops_id')`        | Foreign key referencing the `shops` table, indicating the shop where the expense was incurred. |
| `item`             | `db.String(50)` | `nullable=False`                         | Name of the item purchased.  Cannot be null.                             |
| `description`      | `db.String(50)` | `nullable=False`                         | Description of the expense. Cannot be null.                              |
| `category`         | `db.String(50)` | `nullable=False`                         | Category the expense belongs to. Cannot be null.                          |
| `quantity`         | `db.Float`     | `nullable=True`                          | Quantity of the item purchased. Can be null.                              |
| `paidTo`           | `db.String(50)` | `nullable=True`                          | Name of the recipient of the payment. Can be null.                        |
| `totalPrice`       | `db.Float`     | `nullable=False`                         | Total price of the expense. Cannot be null.                              |
| `amountPaid`       | `db.Float`     | `nullable=False`                         | Amount paid for the expense. Cannot be null.                             |
| `transfer_id`      | `db.Integer`   | `db.ForeignKey('transfers.transfer_id'), nullable=True` | Foreign key referencing the `transfers` table, linking to a related transfer (if any).  |
| `created_at`       | `db.DateTime`  | `nullable=False`                         | Timestamp indicating when the expense record was created. Cannot be null. |


<a name="22-relationships"></a>
### 2.2 Relationships

The `Expenses` model defines relationships with other models:

* **`users`**: A one-to-many relationship with the `Users` model (one user can have many expenses). The `backref` creates a `expenses` attribute on the `Users` model to easily access associated expenses.  Lazy loading is used.
* **`shops`**: A one-to-many relationship with the `Shops` model (one shop can have many expenses). The `backref` creates a `expenses` attribute on the `Shops` model for easy access to associated expenses. Lazy loading is used.
* **`transfer_id`**:  A many-to-one relationship with the `transfers` table (multiple expenses may relate to one transfer).


<a name="23-repr-method"></a>
### 2.3 `__repr__` Method

The `__repr__` method provides a string representation of an `Expenses` object, useful for debugging and display. It returns a formatted string including key attributes of the expense.  The format allows for easy identification of the expense in a console or log.
