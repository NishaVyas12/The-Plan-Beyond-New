export const customStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "#fff",
        fontSize: "1rem",
        marginTop: "8px",
        borderColor: "#e9e6ff",
        boxShadow: state.isFocused ? "#000" : "none",
        "&:hover": {
            borderColor: "#e9e6ff"
        },
        minHeight: "40px",
        borderRadius: "10px"
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? "#2684FF"
            : state.isFocused
                ? "#f0f8ff"
                : "#fff",
        color: state.isSelected ? "#fff" : "#333",
        padding: 10
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 9999
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "#333"
    })
};