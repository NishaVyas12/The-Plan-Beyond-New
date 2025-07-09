import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Country, State, City } from 'country-state-city';
import './FamilyInfo.css';
import addPersonImage from '../../../assets/images/dash_icon/family_icon.svg';
import cameraIcon from "../../../assets/images/dash_icon/camera.svg";

const FamilyInfo = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPetDrawerOpen, setIsPetDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingPetId, setEditingPetId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    email: '',
    phone: '',
    phoneNumber1: '',
    phoneNumber2: '',
    phoneNumber3: '',
    flatBuildingNo: '',
    street: '',
    country: '',
    state: '',
    city: '',
    zipcode: '',
    profileImage: null,
    birthday: '',
    relation: '',
  });
  const [petFormData, setPetFormData] = useState({
    name: '',
    type: '',
    breed: '',
    birthday: '',
    profileImage: null,
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [pets, setPets] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [optionsMenu, setOptionsMenu] = useState(null);
  // New state for country-state-city dropdowns
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const navigate = useNavigate();

  // Initialize country data
  useEffect(() => {
    const countries = Country.getAllCountries().map(country => ({
      name: country.name,
      isoCode: country.isoCode,
    }));
    setFilteredCountries(countries);
  }, []);

  // Update states when country changes or when editing
  useEffect(() => {
    if (formData.country) {
      const country = Country.getAllCountries().find(c => c.name === formData.country);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode).map(state => ({
          name: state.name,
          isoCode: state.isoCode,
        }));
        setFilteredStates(states);
        // Only reset state if it doesn't match a valid state for the selected country
        if (!states.some(state => state.name === formData.state)) {
          setFormData(prev => ({ ...prev, state: '', city: '' }));
          setFilteredCities([]);
        }
      } else {
        setFilteredStates([]);
        setFormData(prev => ({ ...prev, state: '', city: '' }));
        setFilteredCities([]);
      }
    } else {
      setFilteredStates([]);
      setFilteredCities([]);
      setFormData(prev => ({ ...prev, state: '', city: '' }));
    }
  }, [formData.country]);

  // Update cities when state changes or when editing
  useEffect(() => {
    if (formData.country && formData.state) {
      const country = Country.getAllCountries().find(c => c.name === formData.country);
      const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === formData.state);
      if (country && state) {
        const cities = City.getCitiesOfState(country.isoCode, state.isoCode).map(city => ({
          name: city.name,
        }));
        setFilteredCities(cities);
        // Only reset city if it doesn't match a valid city for the selected state
        if (!cities.some(city => city.name === formData.city)) {
          setFormData(prev => ({ ...prev, city: '' }));
        }
      } else {
        setFilteredCities([]);
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setFilteredCities([]);
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [formData.country, formData.state]);

  // Filter countries based on search
  useEffect(() => {
    const countries = Country.getAllCountries().map(country => ({
      name: country.name,
      isoCode: country.isoCode,
    }));
    if (countrySearch) {
      setFilteredCountries(
        countries.filter(country =>
          country.name.toLowerCase().includes(countrySearch.toLowerCase())
        )
      );
    } else {
      setFilteredCountries(countries);
    }
  }, [countrySearch]);

  // Filter states based on search
  useEffect(() => {
    if (formData.country) {
      const country = Country.getAllCountries().find(c => c.name === formData.country);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode).map(state => ({
          name: state.name,
          isoCode: state.isoCode,
        }));
        if (stateSearch) {
          setFilteredStates(
            states.filter(state =>
              state.name.toLowerCase().includes(stateSearch.toLowerCase())
            )
          );
        } else {
          setFilteredStates(states);
        }
      }
    }
  }, [stateSearch, formData.country]);

  // Filter cities based on search
  useEffect(() => {
    if (formData.country && formData.state) {
      const country = Country.getAllCountries().find(c => c.name === formData.country);
      const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === formData.state);
      if (country && state) {
        const cities = City.getCitiesOfState(country.isoCode, state.isoCode).map(city => ({
          name: city.name,
        }));
        if (citySearch) {
          setFilteredCities(
            cities.filter(city =>
              city.name.toLowerCase().includes(citySearch.toLowerCase())
            )
          );
        } else {
          setFilteredCities(cities);
        }
      }
    }
  }, [citySearch, formData.country, formData.state]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date)) return '-';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleImageUpload = (event, isPet = false) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      if (isPet) {
        setPetFormData((prev) => ({
          ...prev,
          profileImage: file,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          profileImage: file,
        }));
      }
    }
  };

  const fetchFamilyInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to fetch family members.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      toast.error('Error fetching family members. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchPetInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        setPets(data.pets || []);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to fetch pets.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
      toast.error('Error fetching pets. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts?all=true`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        const formattedContacts = data.contacts.map((contact) => ({
          id: contact.id,
          name: [contact.first_name, contact.middle_name, contact.last_name]
            .filter(Boolean)
            .join(' ')
            .trim(),
          first_name: contact.first_name || '',
          middle_name: contact.middle_name || '',
          last_name: contact.last_name || '',
          phone: contact.phone_number || '',
          email: contact.email || '',
          phone_number1: contact.phone_number1 || '',
          phone_number2: contact.phone_number2 || '',
          phone_number3: contact.phone_number3 || '',
          flat_building_no: contact.flat_building_no || '',
          street: contact.street || '',
          country: contact.country || '',
          state: contact.state || '',
          city: contact.city || '',
          postal_code: contact.postal_code || '',
          contact_image: contact.contact_image || '',
          date_of_birth: contact.date_of_birth || '',
          relation: contact.relation || '',
        }));
        setContacts(formattedContacts);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to fetch contacts.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      toast.error('Error fetching contacts. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchFamilyInfo();
    fetchPetInfo();
    fetchAllContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetInputChange = (name, value) => {
    setPetFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleFamilyAddClick = () => {
    setIsEditing(false);
    setEditingMemberId(null);
    setIsDrawerOpen(true);
    setIsDropdownOpen(false);
  };

  const handlePetAddClick = () => {
    setIsPetDrawerOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsEditing(false);
    setEditingMemberId(null);
    setSearchQuery('');
    setIsSearchFocused(false);
    setShowPhone1(false);
    setShowPhone2(false);
    setFilteredContacts([]);
    setImagePreview(null);
    setCountrySearch('');
    setStateSearch('');
    setCitySearch('');
    setIsCountryDropdownOpen(false);
    setIsStateDropdownOpen(false);
    setIsCityDropdownOpen(false);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      nickname: '',
      email: '',
      phone: '',
      phoneNumber1: '',
      phoneNumber2: '',
      phoneNumber3: '',
      flatBuildingNo: '',
      street: '',
      country: '',
      state: '',
      city: '',
      zipcode: '',
      profileImage: null,
      birthday: '',
      relation: '',
    });
    // Reset filtered states and cities
    setFilteredStates([]);
    setFilteredCities([]);
  };

  const handleClosePetDrawer = () => {
  setIsPetDrawerOpen(false);
  setIsEditing(false);
  setEditingPetId(null);
  setImagePreview(null);
  setPetFormData({
    name: '',
    type: '',
    breed: '',
    birthday: '',
    profileImage: null,
  });
};

  const handleAddPhoneNumber = () => {
    if (!showPhone1) {
      setShowPhone1(true);
    } else if (!showPhone2) {
      setShowPhone2(true);
    }
  };


  
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('middle_name', formData.middleName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('nickname', formData.nickname);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone_number', formData.phone);
      formDataToSend.append('phone_number1', formData.phoneNumber1);
      formDataToSend.append('phone_number2', formData.phoneNumber2);
      formDataToSend.append('phone_number3', formData.phoneNumber3);
      formDataToSend.append('flat_building_no', formData.flatBuildingNo);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('zipcode', formData.zipcode);
      formDataToSend.append('birthday', formData.birthday);
      formDataToSend.append('relation', formData.relation);
      if (formData.profileImage instanceof File) {
        formDataToSend.append('profile_image', formData.profileImage);
      } else if (formData.profileImage === '') {
        formDataToSend.append('profile_image', '');
      }

      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/api/familyinfo/${editingMemberId}/basic`
        : `${import.meta.env.VITE_API_URL}/api/familyinfo/save`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isEditing ? 'Family member updated successfully.' : 'Family member saved successfully.', {
          position: 'top-right',
          autoClose: 3000,
        });
        handleCloseDrawer();
        await fetchFamilyInfo();
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || `Failed to ${isEditing ? 'update' : 'save'} family member.`, {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} family member:`, err);
      toast.error(`Error ${isEditing ? 'updating' : 'saving'} family member. Please try again.`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleEditFamilyMember = (member) => {
    setIsEditing(true);
    setEditingMemberId(member.id);
    const formattedDate = member.birthday
      ? new Date(member.birthday).toISOString().split('T')[0]
      : '';
    setFormData({
      firstName: member.first_name || '',
      middleName: member.middle_name || '',
      lastName: member.last_name || '',
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone_number || '',
      phoneNumber1: member.phone_number1 || '',
      phoneNumber2: member.phone_number2 || '',
      phoneNumber3: member.phone_number3 || '',
      flatBuildingNo: member.flat_building_no || '',
      street: member.street || '',
      country: member.country || '',
      state: member.state || '',
      city: member.city || '',
      zipcode: member.zipcode || '',
      profileImage: member.profile_image || '',
      birthday: formattedDate,
      relation: member.relation || '',
    });
    setShowPhone1(!!member.phone_number1);
    setShowPhone2(!!member.phone_number2);
    setImagePreview(member.profile_image ? `${import.meta.env.VITE_API_URL}/${member.profile_image.replace(/^\/+/, '')}` : null);
    
    // Initialize dropdowns for country, state, and city
    if (member.country) {
      const country = Country.getAllCountries().find(c => c.name === member.country);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode).map(state => ({
          name: state.name,
          isoCode: state.isoCode,
        }));
        setFilteredStates(states);
        if (member.state && states.some(s => s.name === member.state)) {
          const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === member.state);
          if (state) {
            const cities = City.getCitiesOfState(country.isoCode, state.isoCode).map(city => ({
              name: city.name,
            }));
            setFilteredCities(cities);
          }
        }
      }
    }
    
    setIsDrawerOpen(true);
    setOptionsMenu(null);
  };

  const handleDeleteFamilyMember = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Family member deleted successfully.', {
          position: 'top-right',
          autoClose: 3000,
        });
        await fetchFamilyInfo();
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to delete family member.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error deleting family member:', err);
      toast.error('Error deleting family member. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
    setOptionsMenu(null);
  };


  const handleEditPet = (pet) => {
  setIsEditing(true);
  setEditingPetId(pet.id);
  setPetFormData({
    name: pet.name || '',
    type: pet.type || '',
    breed: pet.breed || '',
    birthday: pet.birthday ? new Date(pet.birthday).toISOString().split('T')[0] : '',
    profileImage: pet.photo || null,
  });
  setImagePreview(pet.photo ? `${import.meta.env.VITE_API_URL}/${pet.photo.replace(/^\/+/, '')}` : null);
  setIsPetDrawerOpen(true);
  setOptionsMenu(null);
};

const handleDeletePet = async (id) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (data.success) {
      toast.success('Pet deleted successfully.', {
        position: 'top-right',
        autoClose: 3000,
      });
      await fetchPetInfo();
    } else {
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
          onClose: () => navigate('/login'),
        });
      } else {
        toast.error(data.message || 'Failed to delete pet.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  } catch (err) {
    console.error('Error deleting pet:', err);
    toast.error('Error deleting pet. Please try again.', {
      position: 'top-right',
      autoClose: 3000,
    });
  }
  setOptionsMenu(null);
};

 const handleSavePet = async () => {
  try {
    const formDataToSend = new FormData();
    formDataToSend.append('name', petFormData.name);
    formDataToSend.append('type', petFormData.type);
    formDataToSend.append('breed', petFormData.breed);
    formDataToSend.append('birthday', petFormData.birthday);
    if (petFormData.profileImage instanceof File) {
      formDataToSend.append('profileImage', petFormData.profileImage);
    } else if (petFormData.profileImage === '') {
      formDataToSend.append('profileImage', '');
    }

    const url = editingPetId
      ? `${import.meta.env.VITE_API_URL}/api/pets/${editingPetId}`
      : `${import.meta.env.VITE_API_URL}/api/pets`;
    const method = editingPetId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      credentials: 'include',
      body: formDataToSend,
    });

    const data = await response.json();
    if (data.success) {
      toast.success(editingPetId ? 'Pet updated successfully.' : 'Pet saved successfully.', {
        position: 'top-right',
        autoClose: 3000,
      });
      handleClosePetDrawer();
      await fetchPetInfo();
    } else {
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
          onClose: () => navigate('/login'),
        });
      } else {
        toast.error(data.message || `Failed to ${editingPetId ? 'update' : 'save'} pet.`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  } catch (err) {
    console.error(`Error ${editingPetId ? 'updating' : 'saving'} pet:`, err);
    toast.error(`Error ${editingPetId ? 'updating' : 'saving'} pet. Please try again.`, {
      position: 'top-right',
      autoClose: 3000,
    });
  }
};

  const handleSelectContact = (contact) => {
    const formattedDate = contact.date_of_birth
      ? new Date(contact.date_of_birth).toISOString().split('T')[0]
      : '';
    setFormData({
      firstName: contact.first_name || '',
      middleName: contact.middle_name || '',
      lastName: contact.last_name || '',
      nickname: contact.nickname || '',
      email: contact.email || '',
      phone: contact.phone || '',
      phoneNumber1: contact.phone_number1 || '',
      phoneNumber2: contact.phone_number2 || '',
      phoneNumber3: contact.phone_number3 || '',
      flatBuildingNo: contact.flat_building_no || '',
      street: contact.street || '',
      country: contact.country || '',
      state: contact.state || '',
      city: contact.city || '',
      zipcode: contact.postal_code || '',
      profileImage: contact.contact_image || '',
      birthday: formattedDate,
      relation: contact.relation || '',
    });
    setShowPhone1(!!contact.phone_number1);
    setShowPhone2(!!contact.phone_number2);
    setImagePreview(contact.contact_image ? `${import.meta.env.VITE_API_URL}/${contact.contact_image.replace(/^\/+/, '')}` : null);
    setSearchQuery(contact.name);
    setIsSearchFocused(false);
    setFilteredContacts([]);
    // Initialize dropdowns for country, state, and city
    if (contact.country) {
      const country = Country.getAllCountries().find(c => c.name === contact.country);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode).map(state => ({
          name: state.name,
          isoCode: state.isoCode,
        }));
        setFilteredStates(states);
        if (contact.state && states.some(s => s.name === contact.state)) {
          const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === contact.state);
          if (state) {
            const cities = City.getCitiesOfState(country.isoCode, state.isoCode).map(city => ({
              name: city.name,
            }));
            setFilteredCities(cities);
          }
        }
      }
    }
  };

  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return 'NA';
  };

  const getPetInitials = (name) => {
    return name ? name[0].toUpperCase() : 'NA';
  };

  const handleCardClick = (id) => {
    if (!id) {
      handleFamilyAddClick();
    } else {
      navigate(`/family-detail/${id}`);
    }
  };

  const handlePetCardClick = (id) => {
    if (!id) {
      setIsPetDrawerOpen(true);
    } else {
      navigate(`/pet-detail/${id}`);
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return null;
    const normalizedPhoto = photo.replace(/^\/+|\/+$/g, '');
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    const encodedPhoto = encodeURI(normalizedPhoto);
    const url = `${baseUrl}/${encodedPhoto}`;
    return url;
  };

  const handleImageError = (id, url) => {
    console.error(`Failed to load image for ${id} at URL: ${url}`);
  };

  const toggleOptionsMenu = (id, event) => {
    event.stopPropagation();
    setOptionsMenu(optionsMenu === id ? null : id);
  };

  return (
    <div className="family-id-add-contact-page">
      <ToastContainer />
      <div className="family-id-contact-header">
        <div className="family-id-contact-header-actions">
          <h1 className="family-id-add-contact-title">Family Info and IDs</h1>
          <div className="family-id-contact-add-button-container">
            <button className="family-id-contact-add-button" onClick={handleAddClick}>
              + Add
            </button>
            {isDropdownOpen && (
              <div className="family-id-contact-add-dropdown">
                <div className="family-id-contact-add-option" onClick={handleFamilyAddClick}>
                  Family
                </div>
                <div className="family-id-contact-add-option" onClick={handlePetAddClick}>
                  Pet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <h2 className="family-id-section-heading">Family</h2>
      <div className="family-id-card-container">
        {familyMembers.map((member) => (
          <div key={member.id} className="family-id-card" onClick={() => handleCardClick(member.id)}>
            <div className="family-id-card-content">
              <div className="family-id-avatar-wrapper">
                <div
                  className="family-id-avatar"
                  style={
                    member.profile_image
                      ? { backgroundImage: `url(${getImageUrl(member.profile_image)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : {}
                  }
                  onError={() => handleImageError(member.id, getImageUrl(member.profile_image))}
                >
                  {!member.profile_image && <span>{getInitials(member.first_name, member.last_name)}</span>}
                </div>
              </div>
              <div className="family-id-details">
                <div className="family-id-name-options">
                  <h3 className="family-id-card-name">
                    {`${member.first_name} ${member.last_name}`.trim() || 'Not Assigned'}
                  </h3>
                  <span className="family-id-card-options" onClick={(e) => toggleOptionsMenu(member.id, e)}>
                    ...
                  </span>
                  {optionsMenu === member.id && (
                    <div className="family-id-options-menu">
                      <div
                        className="family-id-options-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFamilyMember(member);
                        }}
                      >
                        Edit
                      </div>
                      <div
                        className="family-id-options-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFamilyMember(member.id);
                        }}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </div>
                <p className="family-id-card-value-relation">{member.relation || '-'}</p>
              </div>
            </div>
            <div className="family-id-card-info">
              <p className="family-id-card-label">Birthday</p>
              <p className="family-id-card-value">{formatDate(member.birthday)}</p>
            </div>
          </div>
        ))}
        <div className="family-id-card" onClick={() => handleCardClick(null)}>
          <div className="family-id-card-content">
            <div className="family-id-avatar-wrapper">
              <div
                className="family-id-avatar"
                style={{
                  backgroundImage: `url(${addPersonImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
            </div>
            <div className="family-id-details">
              <div className="family-id-name-options">
                <h3 className="family-id-card-name">New Family ID</h3>
                <span className="family-id-card-options">...</span>
              </div>
              <p className="family-id-card-value-relation">-</p>
            </div>
          </div>
          <div className="family-id-card-info-add">
            <p className="family-id-card-label-add">+Add Person</p>
          </div>
        </div>
      </div>

      <h2 className="family-id-section-heading">Pets</h2>
<div className="family-id-card-container">
  {pets.map((pet) => (
    <div key={pet.id} className="family-id-card" onClick={() => handlePetCardClick(pet.id)}>
      <div className="family-id-card-content">
        <div className="family-id-avatar-wrapper">
          <div
            className="family-id-avatar"
            style={
              pet.photo && getImageUrl(pet.photo)
                ? { backgroundImage: `url(${getImageUrl(pet.photo)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { backgroundColor: '#DAE8E8' }
            }
            onError={() => handleImageError(pet.id, getImageUrl(pet.photo))}
          >
            {!pet.photo && <span>{getPetInitials(pet.name)}</span>}
          </div>
        </div>
        <div className="family-id-details">
          <div className="family-id-name-options">
            <h3 className="family-id-card-name">{pet.name || 'Not Assigned'}</h3>
            <span className="family-id-card-options" onClick={(e) => toggleOptionsMenu(pet.id, e)}>
              ...
            </span>
            {optionsMenu === pet.id && (
              <div className="family-id-options-menu">
                <div
                  className="family-id-options-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPet(pet);
                  }}
                >
                  Edit
                </div>
                <div
                  className="family-id-options-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePet(pet.id);
                  }}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
          <p className="family-id-card-value-relation">{pet.breed || '-'}</p>
        </div>
      </div>
      <div className="family-id-card-info">
        <p className="family-id-card-label">Birthday</p>
        <p className="family-id-card-value">{formatDate(pet.birthday)}</p>
      </div>
    </div>
  ))}
  <div className="family-id-card" onClick={() => handlePetCardClick(null)}>
    <div className="family-id-card-content">
      <div className="family-id-avatar-wrapper">
        <div
          className="family-id-avatar"
          style={{
            backgroundImage: `url(${addPersonImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
      </div>
      <div className="family-id-details">
        <div className="family-id-name-options">
          <h3 className="family-id-card-name">New Pet</h3>
          <span className="family-id-card-options">...</span>
        </div>
        <p className="family-id-card-value-relation">-</p>
      </div>
    </div>
    <div className="family-id-card-info-add">
      <p className="family-id-card-label-add">+Add Pet</p>
    </div>
  </div>
</div>

      <div
        className="family-id-add-contact-drawer-backdrop"
        style={{ display: isDrawerOpen ? 'block' : 'none' }}
        onClick={handleCloseDrawer}
      ></div>
      <div className={`family-id-add-contact-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="family-id-add-contact-drawer-top">
          <button className="family-id-add-contact-drawer-close" onClick={handleCloseDrawer}>
            ×
          </button>
        </div>
        <div className="family-id-add-contact-drawer-divider"></div>
        <h2 className="family-id-add-contact-drawer-heading">{isEditing ? 'Edit Family Member' : 'Add Family Member'}</h2>
        <div className="family-id-add-contact-form-content">
          <div className="nominee-add-form-row">
            <div className="nominee-add-field-group full-width">
              <div className="nominee-add-profile-section">
                <div className="nominee-add-avatar-wrapper-add-nominee">
                  <div
                    className="nominee-add-avatar-add-nominee"
                    style={
                      imagePreview
                        ? {
                            backgroundImage: `url(${imagePreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : { backgroundColor: '#DAE8E8' }
                    }
                  >
                    <label
                      htmlFor="family-avatar-upload"
                      className="nominee-add-avatar-upload"
                    >
                      <img
                        src={cameraIcon}
                        alt="Camera"
                        className="nominee-add-camera-icon"
                      />
                      <input
                        type="file"
                        id="family-avatar-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, false)}
                      />
                    </label>
                  </div>
                </div>
                <label
                  htmlFor="family-avatar-upload"
                  className="nominee-add-profile-label"
                  style={{ cursor: 'pointer' }}
                >
                  {imagePreview ? 'Change Photo' : 'Add Photo'}
                </label>
              </div>
            </div>
            <div className="family-id-add-contact-form-group full-width">
              <label className="family-id-add-contact-form-label">Search Contact</label>
              <input
                type="text"
                className="family-id-add-contact-form-input"
                placeholder="Search existing contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              {isSearchFocused && (
                <div className="family-id-contact-search-dropdown">
                  {(searchQuery ? filteredContacts : contacts).map((contact) => (
                    <div
                      key={contact.id}
                      className="family-id-contact-search-option"
                      onClick={() => handleSelectContact(contact)}
                    >
                      {contact.name} ({contact.phone})
                    </div>
                  ))}
                  {(searchQuery ? filteredContacts : contacts).length === 0 && (
                    <div className="family-id-contact-search-option">
                      No contacts found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="family-id-add-contact-form-row">
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="family-id-add-contact-form-input"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  className="family-id-add-contact-form-input"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="family-id-add-contact-form-input"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
            </div>
            <div className="family-id-add-contact-form-row">
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  className="family-id-add-contact-form-input"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="family-id-add-contact-form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  className="family-id-add-contact-form-input"
                  value={formData.birthday}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Relation</label>
                <input
                  type="text"
                  name="relation"
                  className="family-id-add-contact-form-input"
                  value={formData.relation}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  placeholder="e.g., Mother, Father, Sibling"
                />
              </div>
            </div>
            <div className="family-id-add-contact-form-row">
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Phone</label>
                <PhoneInput
                  country="in"
                  value={formData.phone}
                  onChange={(phone) => handleInputChange('phone', phone)}
                  inputClass="family-id-add-contact-form-input"
                  containerClass="family-id-add-contact-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
              {showPhone1 && (
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Phone Number 1</label>
                  <PhoneInput
                    country="in"
                    value={formData.phoneNumber1}
                    onChange={(phone) => handleInputChange('phoneNumber1', phone)}
                    inputClass="family-id-add-contact-form-input"
                    containerClass="family-id-add-contact-phone-input-container"
                    enableSearch
                    disableDropdown={false}
                  />
                </div>
              )}
              {showPhone2 && (
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Phone Number 2</label>
                  <PhoneInput
                    country="in"
                    value={formData.phoneNumber2}
                    onChange={(phone) => handleInputChange('phoneNumber2', phone)}
                    inputClass="family-id-add-contact-form-input"
                    containerClass="family-id-add-contact-phone-input-container"
                    enableSearch
                    disableDropdown={false}
                  />
                </div>
              )}
              {(!showPhone1 || !showPhone2) && (
                <div className="family-id-add-contact-form-group full-width">
                  <button
                    type="button"
                    className="family-id-add-contact-form-button add-number"
                    onClick={handleAddPhoneNumber}
                  >
                    + Add Another Number
                  </button>
                </div>
              )}
            </div>
            <div className="family-id-add-contact-form-row">
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Flat/Building No</label>
                <input
                  type="text"
                  name="flatBuildingNo"
                  className="family-id-add-contact-form-input"
                  value={formData.flatBuildingNo}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Street</label>
                <input
                  type="text"
                  name="street"
                  className="family-id-add-contact-form-input"
                  value={formData.street}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Country</label>
                <input
                  type="text"
                  className="family-id-add-contact-form-input"
                  value={formData.country}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    handleInputChange('country', e.target.value);
                  }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 200)}
                />
                {isCountryDropdownOpen && (
                  <div className="family-id-contact-search-dropdown">
                    {filteredCountries.map((country) => (
                      <div
                        key={country.isoCode}
                        className="family-id-contact-search-option"
                        onClick={() => {
                          handleInputChange('country', country.name);
                          setCountrySearch('');
                          setIsCountryDropdownOpen(false);
                        }}
                      >
                        {country.name}
                      </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="family-id-contact-search-option">
                        No countries found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="family-id-add-contact-form-row">
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">State</label>
                <input
                  type="text"
                  className="family-id-add-contact-form-input"
                  value={formData.state}
                  onChange={(e) => {
                    setStateSearch(e.target.value);
                    handleInputChange('state', e.target.value);
                  }}
                  onFocus={() => setIsStateDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsStateDropdownOpen(false), 200)}
                  disabled={!formData.country}
                />
                {isStateDropdownOpen && formData.country && (
                  <div className="family-id-contact-search-dropdown">
                    {filteredStates.map((state) => (
                      <div
                        key={state.isoCode}
                        className="family-id-contact-search-option"
                        onClick={() => {
                          handleInputChange('state', state.name);
                          setStateSearch('');
                          setIsStateDropdownOpen(false);
                        }}
                      >
                        {state.name}
                      </div>
                    ))}
                    {filteredStates.length === 0 && (
                      <div className="family-id-contact-search-option">
                        No states found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">City</label>
                <input
                  type="text"
                  className="family-id-add-contact-form-input"
                  value={formData.city}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    handleInputChange('city', e.target.value);
                  }}
                  onFocus={() => setIsCityDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCityDropdownOpen(false), 200)}
                  disabled={!formData.state}
                />
                {isCityDropdownOpen && formData.country && formData.state && (
                  <div className="family-id-contact-search-dropdown">
                    {filteredCities.map((city) => (
                      <div
                        key={city.name}
                        className="family-id-contact-search-option"
                        onClick={() => {
                          handleInputChange('city', city.name);
                          setCitySearch('');
                          setIsCityDropdownOpen(false);
                        }}
                      >
                        {city.name}
                      </div>
                    ))}
                    {filteredCities.length === 0 && (
                      <div className="family-id-contact-search-option">
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Zipcode</label>
                <input
                  type="text"
                  name="zipcode"
                  className="family-id-add-contact-form-input"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                />
              </div>
            </div>
            <div className="family-id-add-contact-form-actions">
              <button className="family-id-add-contact-form-button cancel" onClick={handleCloseDrawer}>
                Cancel
              </button>
              <button className="family-id-add-contact-form-button save" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
        <div
          className="family-id-add-contact-drawer-backdrop"
          style={{ display: isPetDrawerOpen ? 'block' : 'none' }}
          onClick={handleClosePetDrawer}
        ></div>
        <div className={`family-id-add-contact-drawer ${isPetDrawerOpen ? 'open' : ''}`}>
          <div className="family-id-add-contact-drawer-top">
            <button className="family-id-add-contact-drawer-close" onClick={handleClosePetDrawer}>
              ×
            </button>
          </div>
          <div className="family-id-add-contact-drawer-divider"></div>
         <h2 className="family-id-add-contact-drawer-heading">{isEditing ? 'Edit Pet' : 'Add Pet'}</h2>
          <div className="family-id-add-contact-form-content">
            <div className="nominee-add-form-row">
              <div className="nominee-add-field-group full-width">
                <div className="nominee-add-profile-section">
                  <div className="nominee-add-avatar-wrapper-add-nominee">
                    <div
                      className="nominee-add-avatar-add-nominee"
                      style={
                        imagePreview
                          ? {
                              backgroundImage: `url(${imagePreview})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : { backgroundColor: "#DAE8E8" }
                      }
                    >
                      <label
                        htmlFor="avatar-upload-form"
                        className="nominee-add-avatar-upload"
                      >
                        <img
                          src={cameraIcon}
                          alt="Camera"
                          className="nominee-add-camera-icon"
                        />
                        <input
                          type="file"
                          id="avatar-upload-form"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleImageUpload(e, true)}
                        />
                      </label>
                    </div>
                  </div>
                  <label
                    htmlFor="avatar-upload-form"
                    className="nominee-add-profile-label"
                    style={{ cursor: "pointer" }}
                  >
                    {imagePreview ? 'Change Photo' : 'Add Photo'}
                  </label>
                </div>
              </div>
              <div className="family-id-add-contact-form-row">
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Pet Name</label>
                  <input
                    type="text"
                    name="name"
                    className="family-id-add-contact-form-input"
                    value={petFormData.name}
                    onChange={(e) => handlePetInputChange(e.target.name, e.target.value)}
                  />
                </div>
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Pet Type</label>
                  <input
                    type="text"
                    name="type"
                    className="family-id-add-contact-form-input"
                    value={petFormData.type}
                    onChange={(e) => handlePetInputChange(e.target.name, e.target.value)}
                    placeholder="e.g., Dog, Cat"
                  />
                </div>
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Breed</label>
                  <input
                    type="text"
                    name="breed"
                    className="family-id-add-contact-form-input"
                    value={petFormData.breed}
                    onChange={(e) => handlePetInputChange(e.target.name, e.target.value)}
                  />
                </div>
                <div className="family-id-add-contact-form-group">
                  <label className="family-id-add-contact-form-label">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    className="family-id-add-contact-form-input"
                    value={petFormData.birthday}
                    onChange={(e) => handlePetInputChange(e.target.name, e.target.value)}
                  />
                </div>
              </div>
              <div className="family-id-add-contact-form-actions">
                <button className="family-id-add-contact-form-button cancel" onClick={handleClosePetDrawer}>
                  Cancel
                </button>
                <button className="family-id-add-contact-form-button save" onClick={handleSavePet}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyInfo;