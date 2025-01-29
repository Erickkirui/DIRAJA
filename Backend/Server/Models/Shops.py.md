# Internal Code Documentation: Shops Model

[Linked Table of Contents](#linked-table-of-contents)

## Linked Table of Contents

* [1. Overview](#1-overview)
* [2. Class `Shops`](#2-class-shops)
    * [2.1 Table Columns](#21-table-columns)
    * [2.2 Validator: `validate_shopstatus`](#22-validator-validateshopstatus)
    * [2.3 Representation: `__repr__`](#23-representation-repr)


## 1. Overview

This document details the `Shops` model, a SQLAlchemy model used to represent shop information within the application's database.  The model defines the structure and validation rules for shop data.


## 2. Class `Shops`

The `Shops` class is a SQLAlchemy declarative model that maps to the `shops` table in the database.  It utilizes Flask-SQLAlchemy for database interaction.

### 2.1 Table Columns

The `Shops` model includes the following columns:

| Column Name      | Data Type     | Constraints                               | Description                                      |
|-----------------|-----------------|-------------------------------------------|--------------------------------------------------|
| `shops_id`       | `db.Integer`   | `primary_key=True`, `autoincrement=True` | Unique identifier for each shop record.          |
| `shopname`       | `db.String(50)` | `unique=True`, `nullable=False`         | Name of the shop (must be unique).             |
| `location`       | `db.String(50)` | `nullable=False`                         | Location of the shop.                            |
| `employee`       | `db.JSON`       | `unique=True`, `nullable=False`         | JSON representation of employee information.     |
| `shopstatus`     | `db.String(50)` | `default="active"`, `nullable=False`    | Status of the shop (active or inactive).       |
| `created_at`     | `db.DateTime`   | `server_default=db.func.now()`           | Timestamp indicating when the record was created.|


### 2.2 Validator: `validate_shopstatus`

The `@validates('shopstatus')` decorator applies a validation function to the `shopstatus` attribute before it's written to the database.

The `validate_shopstatus` function ensures that the `shopstatus` value is one of the allowed values: `'active'` or `'inactive'`. It uses an assertion to raise an error if an invalid status is provided.  The list of valid statuses is explicitly defined for clarity and maintainability.

```python
@validates('shopstatus')
def validate_shopstatus(self, key, shopstatus):
    valid_shopstatus = ['active', 'inactive']
    assert shopstatus in valid_shopstatus, f"Invalid status. Must be one of: {', '.join(valid_shopstatus)}"
    return shopstatus
```

### 2.3 Representation: `__repr__`

The `__repr__` method provides a string representation of the `Shops` object, useful for debugging and logging.  It displays key attributes of the shop.  Note that `self.id` is used instead of `self.shops_id` which is likely a typo in the provided code.

```python
def __repr__(self):
    return f"Shop(id={self.id}, sales_id='{self.sales_id}', shopname='{self.shopname}', employee='{self.employee}', shopstatus='{self.shopstatus}')"
```
  (Note: `self.sales_id` is referenced here but not defined in the provided code snippet.  This suggests a potential error or missing attribute.)

