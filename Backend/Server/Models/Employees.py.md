# Employees Model Documentation

[Linked Table of Contents](#linked-table-of-contents)

## Linked Table of Contents

* [1. Overview](#1-overview)
* [2. Class Attributes](#2-class-attributes)
* [3. Relationships](#3-relationships)
* [4. Validation Methods](#4-validation-methods)
    * [4.1 `validate_email`](#41-validate_email)
    * [4.2 `validate_role`](#42-validate_role)
    * [4.3 `validate_phone_number`](#43-validate_phone_number)
    * [4.4 `validate_contract_termination_date`](#44-validate_contract_termination_date)
    * [4.5 `validate_account_status`](#45-validate_account_status)
* [5. `__repr__` Method](#5-repr-method)


## 1. Overview

This document details the `Employees` model, a SQLAlchemy model used to represent employee data within the application's database.  The model defines various attributes to store employee information and includes validation methods to ensure data integrity.  The model uses Flask-SQLAlchemy for database interaction.


## 2. Class Attributes

The `Employees` model consists of the following attributes, mapped to database columns:

| Column Name             | Data Type     | Nullable | Description                                      |
|--------------------------|----------------|----------|--------------------------------------------------|
| `employee_id`           | `db.Integer`  | False    | Primary key, auto-incrementing employee ID.      |
| `first_name`            | `db.String(50)`| False    | Employee's first name.                           |
| `middle_name`           | `db.String(50)`| False    | Employee's middle name.                          |
| `surname`               | `db.String(50)`| False    | Employee's surname.                             |
| `phone_number`          | `db.Integer`  | False    | Employee's phone number.                          |
| `work_email`            | `db.String(50)`| False    | Employee's work email address.                    |
| `account_status`        | `db.String(50)`| False    | Employee's account status (active/inactive).     |
| `shop_id`               | `db.Integer`  | True     | Foreign key referencing the `shops` table.       |
| `role`                  | `db.String(50)`| False    | Employee's role (e.g., manager, clerk).         |
| `personal_email`        | `db.String(50)`| True     | Employee's personal email address.                |
| `designation`           | `db.String(50)`| True     | Employee's designation.                          |
| `date_of_birth`         | `db.DateTime` | True     | Employee's date of birth.                        |
| `national_id_number`    | `db.Integer`  | True     | Employee's national ID number.                   |
| `kra_pin`               | `db.String(50)`| True     | Employee's KRA PIN (Kenya Revenue Authority).    |
| `monthly_gross_salary`  | `db.Float`    | True     | Employee's monthly gross salary.                 |
| `payment_method`        | `db.String(50)`| True     | Employee's payment method.                       |
| `bank_account_number`   | `db.Integer`  | True     | Employee's bank account number.                  |
| `bank_name`             | `db.String(50)`| True     | Employee's bank name.                            |
| `department`            | `db.String(50)`| True     | Employee's department.                           |
| `starting_date`         | `db.DateTime` | True     | Employee's starting date.                        |
| `contract_termination_date` | `db.DateTime` | True     | Employee's contract termination date.             |
| `contract_renewal_date` | `db.DateTime` | True     | Employee's contract renewal date.                |
| `created_at`           | `db.DateTime` | True     | Timestamp indicating when the record was created.|


## 3. Relationships

The `Employees` model has a one-to-many relationship with the `Shops` model:

*   `shops = db.relationship('Shops', backref='employees', lazy=True)`: This defines a relationship where one shop can have multiple employees.  `backref` creates a `employees` attribute on the `Shops` model for easy access to its associated employees. `lazy=True` means the related shops are loaded only when accessed.

## 4. Validation Methods

The `Employees` model includes several validation methods using `@validates` decorator to ensure data integrity before it's saved to the database.

### 4.1 `validate_email`

This method validates the `work_email` attribute to ensure it contains "@" symbol and a valid domain name.  It raises an `AssertionError` if the email is invalid.

### 4.2 `validate_role`

This method validates the `role` attribute, ensuring it's one of the predefined valid roles (`'manager'`, `'clerk'`). An `AssertionError` is raised if the role is invalid.

### 4.3 `validate_phone_number`

This method validates the `phone_number` attribute, ensuring it contains only digits and is between 10 and 15 digits long. An `AssertionError` is raised if the phone number is invalid.

### 4.4 `validate_contract_termination_date`

This method validates the `contract_termination_date` attribute. It checks if the termination date is after the `starting_date`.  If both dates are `None`, it allows the record to be created without these dates.  If only one is provided, it raises a `ValueError`.

### 4.5 `validate_account_status`

This method validates that the `account_status` is either 'active' or 'inactive'. An `AssertionError` is raised if it's invalid.


## 5. `__repr__` Method

The `__repr__` method provides a human-readable string representation of an `Employees` instance, useful for debugging and logging.  It returns a string containing the employee's ID, name, email, and role.
