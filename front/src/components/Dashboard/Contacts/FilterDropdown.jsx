import { useEffect, useState, useRef } from "react";
import debounce from "lodash.debounce";

const FilterDropdown = ({ filterOptions, setFilterOptions }) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomRelationInput, setShowCustomRelationInput] = useState(false);
  const [customRelation, setCustomRelation] = useState("");
  const filterRef = useRef(null);

  const categoryOptions = ["Family", "Friends", "Work", "Custom"];
  const relationOptions = [
    "Son",
    "Daughter",
    "Wife",
    "Husband",
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Custom",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
        setShowCustomCategoryInput(false);
        setShowCustomRelationInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (category) => {
    if (category === "Custom") {
      setShowCustomCategoryInput(!showCustomCategoryInput);
      if (showCustomCategoryInput && customCategory) {
        // Remove custom category if unchecking Custom
        setFilterOptions((prev) => ({
          ...prev,
          categories: prev.categories.filter((cat) => cat !== customCategory),
        }));
        setCustomCategory("");
      }
    } else {
      const updatedCategories = filterOptions.categories.includes(category)
        ? filterOptions.categories.filter((cat) => cat !== category)
        : [...filterOptions.categories, category];
      setFilterOptions((prev) => ({ ...prev, categories: updatedCategories }));
    }
  };

  // Debounced handler for custom category
  const debouncedUpdateCategory = debounce((value) => {
    setFilterOptions((prev) => ({
      ...prev,
      categories: [
        ...prev.categories.filter(
          (cat) => !categoryOptions.includes(cat) && cat !== customCategory
        ),
        value,
      ],
    }));
  }, 300);

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    if (value.trim()) {
      debouncedUpdateCategory(value);
    } else {
      setFilterOptions((prev) => ({
        ...prev,
        categories: prev.categories.filter((cat) => cat !== customCategory),
      }));
    }
  };

  const handleRelationChange = (relation) => {
    if (relation === "Custom") {
      setShowCustomRelationInput(!showCustomRelationInput);
      if (showCustomRelationInput && customRelation) {
        // Remove custom relation if unchecking Custom
        setFilterOptions((prev) => ({
          ...prev,
          relations: prev.relations.filter((rel) => rel !== customRelation),
        }));
        setCustomRelation("");
      }
    } else {
      const updatedRelations = filterOptions.relations.includes(relation)
        ? filterOptions.relations.filter((rel) => rel !== relation)
        : [...filterOptions.relations, relation];
      setFilterOptions((prev) => ({ ...prev, relations: updatedRelations }));
    }
  };

  // Debounced handler for custom relation
  const debouncedUpdateRelation = debounce((value) => {
    setFilterOptions((prev) => ({
      ...prev,
      relations: [
        ...prev.relations.filter(
          (rel) => !relationOptions.includes(rel) && rel !== customRelation
        ),
        value,
      ],
    }));
  }, 300);

  const handleCustomRelationChange = (e) => {
    const value = e.target.value;
    setCustomRelation(value);
    if (value.trim()) {
      debouncedUpdateRelation(value);
    } else {
      setFilterOptions((prev) => ({
        ...prev,
        relations: prev.relations.filter((rel) => rel !== customRelation),
      }));
    }
  };

  const handleSharedAfterPassAwayChange = () => {
    setFilterOptions((prev) => ({
      ...prev,
      sharedAfterPassAway: !prev.sharedAfterPassAway,
    }));
  };

  return (
    <div className="contact-filter-bar" ref={filterRef}>
      <button
        className="contact-filter-button"
        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 4H14M4 8H12M6 12H10"
            stroke="#4C5767"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {showFilterDropdown && (
        <div className="contact-filter-dropdown">
          <div className="filter-section">
            <h4 className="filter-section-title">Category</h4>
            {categoryOptions.map((category) => (
              <div key={category}>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      category === "Custom"
                        ? showCustomCategoryInput
                        : filterOptions.categories.includes(category)
                    }
                    onChange={() => handleCategoryChange(category)}
                  />
                  {category}
                </label>
                {category === "Custom" && showCustomCategoryInput && (
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    placeholder="Enter custom category"
                    autoFocus
                  />
                )}
              </div>
            ))}
          </div>
          <div className="filter-section">
            <h4 className="filter-section-title">Relation</h4>
            {relationOptions.map((relation) => (
              <div key={relation}>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      relation === "Custom"
                        ? showCustomRelationInput
                        : filterOptions.relations.includes(relation)
                    }
                    onChange={() => handleRelationChange(relation)}
                  />
                  {relation}
                </label>
                {relation === "Custom" && showCustomRelationInput && (
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customRelation}
                    onChange={handleCustomRelationChange}
                    placeholder="Enter custom relation"
                    autoFocus
                  />
                )}
              </div>
            ))}
          </div>
          <div className="filter-section">
            <h4 className="filter-section-title">Shared After Pass Away</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filterOptions.sharedAfterPassAway}
                onChange={handleSharedAfterPassAwayChange}
              />
              Shared after pass away
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;