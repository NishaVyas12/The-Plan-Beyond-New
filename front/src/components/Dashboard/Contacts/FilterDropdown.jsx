import { useEffect, useState, useRef } from "react";
import "./Contact.css";
import deleteIcon from "../../../assets/images/Contact/Tuning.svg"; 
const FilterDropdown = ({ filterOptions, setFilterOptions }) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("Category");
  const [showMore, setShowMore] = useState({
    Category: false,
    Relation: false,
  });
  const filterRef = useRef(null);

  // Combine predefined and fetched categories/relations, ensuring uniqueness
  const categoryOptions = [
    ...new Set(["Family", "Friends", "Work", ...(filterOptions.fetchedCategories || [])]),
  ];
  const relationOptions = [
    ...new Set([
      "Son",
      "Daughter",
      "Wife",
      "Husband",
      "Father",
      "Mother",
      "Brother",
      "Sister",
      ...(filterOptions.fetchedRelations || []),
    ]),
  ];

  // Debug: Log options to verify fetched values
  console.log("Category options:", categoryOptions);
  console.log("Relation options:", relationOptions);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const clearFilters = () => {
    setFilterOptions({
      categories: [],
      relations: [],
      sharedAfterPassAway: false,
      fetchedCategories: filterOptions.fetchedCategories,
      fetchedRelations: filterOptions.fetchedRelations,
    });
    setShowMore({ Category: false, Relation: false });
    setShowFilterDropdown(false);
  };

  const toggleShowMore = (tab) => {
    setShowMore((prev) => ({ ...prev, [tab]: !prev[tab] }));
  };

  const tabs = [
    { name: "Category", key: "Category" },
    { name: "Relation", key: "Relation" },
    { name: "Shared After Pass Away", key: "SharedAfterPassAway" },
  ];

  return (
    <div className="contact-filter-bar" ref={filterRef}>
<button
  className="contact-filter-button"
  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
>
  <img src={deleteIcon} alt="Delete Icon" className="contact-header-icon" />
  Filter
</button>
      {showFilterDropdown && (
        <div className="contact-filter-dropdown">
          <div className="filter-tab-wrapper">
            <div className="filter-tab-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`filter-tab-item ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.name}
                </button>
              ))}
            </div>
            <div className="filter-tab-content">
              {activeTab === "Category" && (
                <div className="filter-options-column">
                  {categoryOptions.length > 0 ? (
                    <>
                      {categoryOptions.slice(0, showMore.Category ? undefined : 5).map((category) => (
                        <label key={category} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterOptions.categories.includes(category)}
                            onChange={() => handleCategoryChange(category)}
                          />
                          {category}
                        </label>
                      ))}
                      {categoryOptions.length > 5 && (
                        <button
                          className="filter-show-more"
                          onClick={() => toggleShowMore("Category")}
                        >
                          {showMore.Category ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="filter-no-options">No categories available</div>
                  )}
                </div>
              )}
              {activeTab === "Relation" && (
                <div className="filter-options-column">
                  {relationOptions.length > 0 ? (
                    <>
                      {relationOptions.slice(0, showMore.Relation ? undefined : 5).map((relation) => (
                        <label key={relation} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterOptions.relations.includes(relation)}
                            onChange={() => handleRelationChange(relation)}
                          />
                          {relation}
                        </label>
                      ))}
                      {relationOptions.length > 5 && (
                        <button
                          className="filter-show-more"
                          onClick={() => toggleShowMore("Relation")}
                        >
                          {showMore.Relation ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="filter-no-options">No relations available</div>
                  )}
                </div>
              )}
              {activeTab === "SharedAfterPassAway" && (
                <div className="filter-options-column">
                  <label className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterOptions.sharedAfterPassAway}
                      onChange={handleSharedAfterPassAwayChange}
                    />
                    Enabled
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="filter-actions">
            <button className="filter-button clear" onClick={clearFilters}>
              Clear
            </button>
            <button
              className="filter-button apply"
              onClick={() => setShowFilterDropdown(false)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;