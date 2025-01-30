# EmployeeLoan Model Documentation

[Linked Table of Contents](#linked-table-of-contents)

## Linked Table of Contents

* [1. Overview](#1-overview)
* [2. Class `EmployeeLoan`](#2-class-employeeLoan)
    * [2.1 Attributes](#21-attributes)
    * [2.2 Relationships](#22-relationships)
    * [2.3 `__repr__` Method](#23-__repr__-method)


## 1. Overview

This document details the `EmployeeLoan` model, a SQLAlchemy model used to represent employee loan information within the application's database.  The model defines attributes for loan details and establishes a relationship with the `Employees` model.


## 2. Class `EmployeeLoan`

This class represents an employee's loan record in the database.  It leverages SQLAlchemy's declarative mapping to define the table structure and relationships.


### 2.1 Attributes

The `EmployeeLoan` model has the following attributes:

| Attribute Name        | Data Type | Constraints                               | Description                                         |
|-----------------------|------------|-------------------------------------------|-----------------------------------------------------|
| `loan_id`             | `db.Integer` | `primary_key=True`, `autoincrement=True` | Unique identifier for the loan record. Auto-incrementing. |
| `employee_id`         | `db.Integer` | `db.ForeignKey('employees.employee_id')` | Foreign key referencing the `employee_id` in the `Employees` table. |
| `loan`                | `db.Float`   | `nullable=False`                         | The amount of the loan.  Cannot be null.             |
| `wallet_ballance`     | `db.Float`   | `default=0`                              | The employee's wallet balance associated with this loan. Defaults to 0. |


### 2.2 Relationships

The `EmployeeLoan` model has a relationship with the `Employees` model (assumed to exist elsewhere in the codebase):

* `employees = db.relationship('Employees', backref='employeesLoan', lazy=True)`: This establishes a one-to-many relationship. One employee can have multiple loans.  `backref` creates a convenient attribute named `employeesLoan` within the `Employees` model to access associated loan records. `lazy=True` means the related employee data is loaded only when accessed.


### 2.3 `__repr__` Method

The `__repr__` method provides a string representation of the `EmployeeLoan` object, useful for debugging and inspection:

```python
    def __repr__(self):
        return f"Employee Loan (id={self.id}, employeeid= {self.employee_id}, loan={self.loan}, walletbalance={self.wallet_ballance})"
```

This method returns a formatted string containing the loan ID, employee ID, loan amount, and wallet balance. Note that there was a minor syntax correction in the original `__repr__`  string formatting to ensure proper output.  The corrected version uses f-strings for better readability and maintainability.
