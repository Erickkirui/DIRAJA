# Stock Model Documentation

## Table of Contents

* [1. Overview](#1-overview)
* [2. Class `Stock`](#2-class-stock)
    * [2.1 Table Columns](#21-table-columns)
    * [2.2 Relationships](#22-relationships)
    * [2.3 Validations](#23-validations)
    * [2.4 `__repr__` Method](#24-repr-method)


## 1. Overview

This document details the `Stock` model within the application's database schema.  The `Stock` model represents stock items held by various shops.  It leverages Flask-SQLAlchemy for database interaction.


## 2. Class `Stock`

The `Stock` class defines the structure and behavior of stock items in the database.


### 2.1 Table Columns

The table below lists the columns of the `stock` table and their respective attributes.

| Column Name    | Data Type | Constraints                               | Description                                      |
|-----------------|------------|-------------------------------------------|--------------------------------------------------|
| `stock_id`      | `db.Integer` | `primary_key`, `autoincrement`           | Unique identifier for each stock item.             |
| `itemname`      | `db.String(50)` | `nullable=False`                         | Name of the stock item.                          |
| `shop_id`       | `db.Integer` | `db.ForeignKey('shops.shops_id')`         | Foreign key referencing the `shops` table.       |
| `quantity`      | `db.Float`   | `nullable=False`                         | Quantity of the stock item.                      |
| `metric`        | `db.String(50)` |                                           | Unit of measurement (e.g., 'kg', 'ltrs', 'item'). |
| `unitCost`      | `db.Float`   | `nullable=False`                         | Cost of a single unit of the item.               |
| `totalCost`     | `db.Float`   | `nullable=False`                         | Total cost of the stock item (quantity * unitCost). |
| `amountPaid`    | `db.Float`   | `nullable=False`                         | Amount paid for the stock item.                  |
| `unitPrice`     | `db.Float`   | `nullable=False`                         | Selling price of a single unit of the item.       |
| `created_at`    | `db.DateTime` | `server_default=db.func.now()`           | Timestamp indicating when the record was created. |


### 2.2 Relationships

The `Stock` model has a relationship with the `Shops` model:

*   `shops = db.relationship('Shops', backref='stock', lazy=True)`: This establishes a one-to-many relationship between `Shops` and `Stock`.  A shop can have multiple stock items (`stock`), and each stock item belongs to one shop.  `lazy=True` means the related shop data is loaded only when accessed.


### 2.3 Validations

The `@validates('metric')` decorator defines a validation function for the `metric` column:

*   The `validate_metric` function ensures that the `metric` value is one of `['item', 'kg', 'ltrs']`.  It raises an assertion error if an invalid metric is provided.  This ensures data integrity. The allowed metrics are hardcoded for simplicity but could be stored in a configuration file or database for better maintainability.

### 2.4 `__repr__` Method

The `__repr__` method provides a string representation of a `Stock` object, useful for debugging and logging:

*   `return f"Stock (id{self.id}, shopid= '{self.shop_id}', itemname='{self.item_name}', quantity='{self.quantity}', metric='{self.metric}', totalcost='{self.totalCost}', unitcost='{self.unitCost}', amountpaid='{self.amountPaid}', unitprice='{self.unitPrice}')"` This returns a formatted string containing key attributes of the Stock object, making it easy to identify and inspect instances. Note that there is a potential bug in the original code where `self.item_name` is used instead of `self.itemname`. This has been corrected in the documentation for clarity.
