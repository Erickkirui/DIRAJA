import React from "react";

const AddCategoryForm = ({
  categoryType,
  selectedCategory,
  selectedCashSubcategory,
  newCategory,
  newAmount,
  handleAddCategory,
  handleClearAll,
  setCategoryType,
  setSelectedCategory,
  setSelectedCashSubcategory,
  setNewCategory,
  setNewAmount,
  getDropdownOptions,
}) => {
  return (
    <form onSubmit={handleAddCategory} className="form">
      <label>
        Category Type:
        <select
          value={categoryType}
          onChange={(e) => setCategoryType(e.target.value)}
          className="form-select"
        >
          <option value="Assets">Assets</option>
          <option value="Liabilities">Liabilities</option>
          <option value="Equity">Equity</option>
        </select>
      </label>

      <label>
        Select Category:
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-select"
        >
          <option value="">Select Category</option>
          {getDropdownOptions().map((option, idx) => (
            <option key={idx} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {categoryType === "Assets" && selectedCategory === "Cash" && (
        <label>
          Cash Subcategory:
          <select
            value={selectedCashSubcategory}
            onChange={(e) => setSelectedCashSubcategory(e.target.value)}
            className="form-select"
          >
            <option value="">Select Cash Subcategory</option>
            <option value="Cash at Hand">Cash at Hand</option>
            <option value="Cash in Bank">Cash in Bank</option>
            <option value="Cash in Mpesa">Cash in Mpesa</option>
          </select>
        </label>
      )}

      <label>
        New Category:
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Enter new category"
          className="form-input"
        />
      </label>

      <label>
        Amount:
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Enter amount"
          className="form-input"
        />
      </label>

      <button type="submit" className="form-button">
        Add Category
      </button>
      <button type="button" onClick={handleClearAll} className="form-button">
        Clear All
      </button>
    </form>
  );
};

export default AddCategoryForm;
