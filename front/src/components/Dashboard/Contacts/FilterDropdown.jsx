import { useEffect, useState, useRef } from "react";

const FilterDropdown = ({ filterOptions, setFilterOptions }) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useRef(null);

  const categoryOptions = ["Family", "Friends", "Work"];
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryChange = (category) => {
    const updatedCategories = filterOptions.categories.includes(category)
      ? filterOptions.categories.filter((cat) => cat !== category)
      : [...filterOptions.categories, category];
    setFilterOptions((prev) => ({ ...prev, categories: updatedCategories }));
  };

  const handleRelationChange = (relation) => {
    const updatedRelations = filterOptions.relations.includes(relation)
      ? filterOptions.relations.filter((rel) => rel !== relation)
      : [...filterOptions.relations, relation];
    setFilterOptions((prev) => ({ ...prev, relations: updatedRelations }));
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
              <label key={category} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filterOptions.categories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                {category}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <h4 className="filter-section-title">Relation</h4>
            {relationOptions.map((relation) => (
              <label key={relation} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filterOptions.relations.includes(relation)}
                  onChange={() => handleRelationChange(relation)}
                />
                {relation}
              </label>
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