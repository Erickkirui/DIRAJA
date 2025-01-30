# Internal Code Documentation: Customers Model

## Table of Contents

* [1. Overview](#1-overview)
* [2. Class Definition: `Customers`](#2-class-definition-customers)
    * [2.1 Table Schema](#21-table-schema)
    * [2.2 Relationships](#22-relationships)
    * [2.3 Validation Methods](#23-validation-methods)
        * [2.3.1 `validate_customer_number`](#231-validate_customer_number)
        * [2.3.2 `validate_payment_method`](#232-validate_payment_method)
    * [2.4 `__repr__` Method](#24-repr-method)


<a name="1-overview"></a>
## 1. Overview

This document details the `Customers` model within the application's database schema.  The model represents customer information associated with sales transactions. It leverages Flask-SQLAlchemy for database interaction.


<a name="2-class-definition-customers"></a>
## 2. Class Definition: `Customers`

The `Customers` class is a SQLAlchemy model that defines the structure for customer data in the database.


<a name="21-table-schema"></a>
### 2.1 Table Schema

| Column Name          | Data Type    | Constraints                               | Description                                      |
|----------------------|---------------|-------------------------------------------|--------------------------------------------------|
| `customer_id`        | `db.Integer` | `primary_key`, `autoincrement`            | Unique identifier for each customer.             |
| `customer_name`      | `db.String(50)` | `nullable=True`                           | Customer's name.                                |
| `customer_number`    | `db.Integer` | `nullable=True`                           | Customer's unique identifier number.              |
| `shop_id`            | `db.Integer` | `db.ForeignKey('shops.shops_id')`         | Foreign key referencing the `shops` table.       |
| `sales_id`           | `db.Integer` | `db.ForeignKey('sales.sales_id')`          | Foreign key referencing the `sales` table.        |
| `user_id`            | `db.Integer` | `db.ForeignKey('users.users_id')`         | Foreign key referencing the `users` table.        |
| `item`               | `db.String(50)` | `unique=False`, `nullable=False`         | Item purchased by the customer.                  |
| `amount_paid`        | `db.Float`    | `nullable=False`                           | Amount paid by the customer.                     |
| `payment_method`     | `db.String(50)` | `nullable=False`                           | Payment method used by the customer.             |
| `created_at`         | `db.DateTime` | `server_default=db.func.now()`           | Timestamp indicating when the record was created. |


<a name="22-relationships"></a>
### 2.2 Relationships

The `Customers` model establishes relationships with other models:

* **`shops`**: One-to-many relationship with the `Shops` model.  A shop can have multiple customers.
* **`users`**: One-to-many relationship with the `Users` model. A user can have multiple customers.
* **`sales`**: One-to-many relationship with the `Sales` model. A sale can have multiple customers.


<a name="23-validation-methods"></a>
### 2.3 Validation Methods

The `Customers` model includes validation methods to ensure data integrity.

<a name="231-validate_customer_number"></a>
#### 2.3.1 `validate_customer_number`

This method validates the `customer_number` field.  If an empty string is provided, it sets the value to `None`; otherwise, it returns the provided `customer_number`.

```python
@validates('customer_number')
def validate_customer_number(self, key, customer_number):
    if customer_number == '':
        return None  # Set to None if an empty string is provided
    return customer_number
```

<a name="232-validate_payment_method"></a>
#### 2.3.2 `validate_payment_method`

This method validates that the `payment_method` is one of the allowed methods. It raises an assertion error if the provided method is invalid.

```python
@validates('payment_method')
def validate_payment_method(self, key, payment_method):
    valid_method = ['bank', 'cash', 'mpesa']
    assert payment_method in valid_method, f"Invalid Payment Method. Must be one of: {', '.join(valid_method)}"
    return payment_method
```


<a name="24-repr-method"></a>
### 2.4 `__repr__` Method

The `__repr__` method provides a string representation of a `Customers` instance, useful for debugging and logging.

```python
def __repr__(self):
    return  f"Customers(id={self.id}, customer_name='{self.customer_name}',customer_number='{self.customer_number}',shopId='{self.shop_id}',userId='{self.user_id}',amoutpayed='{self.amount_paid}', paymentMethod='{self.payment_method}')"
```

