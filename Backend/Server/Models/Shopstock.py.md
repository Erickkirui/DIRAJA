# ShopStock Model Documentation

[Linked Table of Contents](#linked-table-of-contents)

## Linked Table of Contents

* [1. Overview](#1-overview)
* [2. Database Model Definition](#2-database-model-definition)
* [3. Attributes](#3-attributes)
* [4. Relationships](#4-relationships)
* [5. `__repr__` Method](#5-__repr__-method)


## 1. Overview

The `ShopStock` model represents the stock of items at a particular shop.  It stores information about the quantity of each item, its cost, batch number and links this information to the `Shops` and `Inventory` models.  The model utilizes the Flask-SQLAlchemy extension for database interaction.


## 2. Database Model Definition

The `ShopStock` model is defined using SQLAlchemy's declarative mapping style. This allows for defining the database table structure within a Python class.  The `__tablename__` attribute specifies the name of the corresponding database table (`shop_stock`).


## 3. Attributes

The `ShopStock` model consists of the following attributes, which map to columns in the `shop_stock` database table:

| Attribute Name     | Data Type     | Constraints                               | Description                                                                  |
|----------------------|-----------------|-------------------------------------------|------------------------------------------------------------------------------|
| `stock_id`          | `db.Integer`   | `primary_key=True`                        | Unique identifier for each stock entry.                                      |
| `shop_id`           | `db.Integer`   | `db.ForeignKey('shops.shops_id'), nullable=False` | Foreign key referencing the `shops_id` in the `shops` table.                |
| `transfer_id`       | `db.Integer`   | `db.ForeignKey('transfers.transfer_id')` | Foreign key referencing the `transfer_id` in the `transfers` table (nullable)|
| `total_cost`        | `db.Float`      | `nullable=False`                           | Total cost of the stock item.                                                |
| `itemname`          | `db.String(50)` | `nullable=False`                           | Name of the item.                                                            |
| `metric`            | `db.String(50)` |                                           | Unit of measurement (e.g., kg, liters).                                     |
| `inventory_id`      | `db.Integer`   | `db.ForeignKey('inventory.inventory_id'), nullable=False` | Foreign key referencing the `inventory_id` in the `inventory` table.         |
| `quantity`          | `db.Float`      | `nullable=False`                           | Quantity of the item in stock.                                               |
| `BatchNumber`       | `db.String(50)` | `nullable=False`                           | Batch number of the item.                                                    |
| `unitPrice`         | `db.Float`      | `nullable=False`                           | Unit price of the item.                                                     |


## 4. Relationships

The `ShopStock` model defines relationships with other models using SQLAlchemy's `db.relationship` function:

* **`shop = db.relationship('Shops', backref=db.backref('shop_stock', lazy=True))`**:  Establishes a one-to-many relationship with the `Shops` model.  A shop can have multiple stock entries. The `backref` creates a `shop_stock` attribute on the `Shops` model, providing easy access to associated `ShopStock` objects. `lazy=True` means the related objects are loaded when accessed.

* **`inventory = db.relationship('Inventory', backref=db.backref('shop_stock', lazy=True))`**: Establishes a one-to-many relationship with the `Inventory` model. An inventory item can be present in multiple shop stocks. The `backref` similarly creates a `shop_stock` attribute on the `Inventory` model.

* **`transfers = db.relationship('Transfer', backref='shop_stock', lazy=True)`**: Establishes a one-to-many relationship with the `Transfer` model.  A transfer can be associated with multiple shop stock entries.


## 5. `__repr__` Method

The `__repr__` method provides a human-readable string representation of a `ShopStock` object. This is helpful for debugging and logging.  The representation includes the shop ID, item ID, and quantity.  The output format is: `<ShopStock Shop ID: {self.shop_id}, Item ID: {self.inventory_id}, Quantity: {self.quantity}kg>`
