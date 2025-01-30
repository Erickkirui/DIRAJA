# Internal Code Documentation: Distribution Model

[Linked Table of Contents](#linked-table-of-contents)

## Linked Table of Contents

* [1. Overview](#1-overview)
* [2. Class: `Distribution`](#2-class-distribution)
    * [2.1 Attributes](#21-attributes)
    * [2.2 Relationships](#22-relationships)
    * [2.3 `__repr__` Method](#23-__repr__-method)


## 1. Overview

This document details the `Distribution` model, a crucial component for tracking the distribution of inventory items within the application.  The model utilizes SQLAlchemy's ORM to interact with a database table named `distributions`.  This model is designed to record when and how much of a given inventory item has been distributed.


## 2. Class: `Distribution`

The `Distribution` class represents a single instance of inventory item distribution.

### 2.1 Attributes

The following table describes the attributes of the `Distribution` class:

| Attribute Name          | Data Type     | Constraints                               | Description                                                                     |
|--------------------------|-----------------|-------------------------------------------|---------------------------------------------------------------------------------|
| `distribution_id`       | `db.Integer`   | `primary_key=True`                        | Unique identifier for each distribution record.                                  |
| `inventory_id`          | `db.Integer`   | `db.ForeignKey('inventory.inventory_id'), nullable=False` | Foreign key referencing the `inventory_id` in the `inventory` table.           |
| `distributed_at`        | `db.DateTime`  | `server_default=db.func.now()`           | Timestamp indicating when the distribution occurred. Defaults to current time. |
| `remaining_quantity`    | `db.Integer`   |                                           | The quantity of the item remaining after this distribution.                     |


### 2.2 Relationships

The `Distribution` model establishes relationships with other models:

* **`inventory`:** A one-to-many relationship with the `Inventory` model (defined as `db.relationship('Inventory', backref=db.backref('distributions', lazy=True))`).  This allows easy access to the details of the distributed inventory item from a `Distribution` object. The `lazy=True` setting ensures the related `Inventory` object is loaded only when accessed.

* **`transfers`:** A one-to-many relationship with the `Transfer` model (defined as `db.relationship('Transfer', backref='distributions', lazy=True)`). This links distributions to any associated transfer records.  The `lazy=True` setting ensures the related `Transfer` objects are loaded only when accessed.


### 2.3 `__repr__` Method

The `__repr__` method provides a human-readable representation of a `Distribution` object.  It returns a string in the format:  `<Distribution {self.distribution_id} - Item ID: {self.inventory_id}>`. This aids in debugging and improves readability when interacting with `Distribution` objects in the console or debugger.  For example,  a `Distribution` object with `distribution_id` of 1 and `inventory_id` of 10 would be represented as `<Distribution 1 - Item ID: 10>`.
