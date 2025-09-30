import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { setSession } from "../utils/Session";
import { showToast } from "../utils/toast";
import { AiOutlineUser, AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import { FaBriefcase } from "react-icons/fa";
import { MdWork } from "react-icons/md";
import {
  MapPin,
  X,
  Crosshair,
  Eye,
  EyeOff,
  Search,
  Navigation,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useEffect } from "react";
import LOGO from "../images/logo.png";

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accountType: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "",
    profession: "",
    companyName: "",
    address: "",
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchLocation, setSearchLocation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapSearchTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNext = () => {
    if (step === 1 && formData.accountType) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleLocationInputChange = async (value) => {
    setFormData((prev) => ({ ...prev, address: value }));

    if (value.length <= 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&limit=5`
      );
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      showToast.error("Failed to load location suggestions");
      setLocationSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    }));
    setLocationSuggestions([]);
  };

  const loadLeaflet = () => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    const mapContainer = document.getElementById("signup-map-container");
    if (!mapContainer || !window.L) return;

    const map = window.L.map("signup-map-container", {
      center: [19.076, 72.8777],
      zoom: 10,
    });

    window.L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap contributors, © CartoDB",
      }
    ).addTo(map);

    map.on("click", (e) => {
      setSelectedMarker(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchLocation(data.display_name);
      }
    } catch (error) {
      showToast.error("Failed to get location details");
    }
  };

  const confirmLocationSelection = () => {
    if (selectedMarker) {
      setFormData((prev) => ({
        ...prev,
        address: searchLocation,
        latitude: selectedMarker.lat,
        longitude: selectedMarker.lng,
      }));
    }
    setShowMapModal(false);
  };

  const handleMapSearchInput = (value) => {
    setSearchLocation(value);

    if (mapSearchTimeoutRef.current) {
      clearTimeout(mapSearchTimeoutRef.current);
    }

    if (value.length <= 2) {
      setMapSearchSuggestions([]);
      return;
    }

    mapSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5`
        );
        const data = await response.json();
        setMapSearchSuggestions(data);
      } catch (error) {
        showToast.error("Failed to search locations");
        setMapSearchSuggestions([]);
      }
    }, 500);
  };

  const selectMapSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setSearchLocation(suggestion.display_name);
    setMapSearchSuggestions([]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
      setSelectedMarker({ lat, lng });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
          setSelectedMarker({ lat, lng });
          reverseGeocode(lat, lng);
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        showToast.error(
          "Unable to get your current location. Please search manually."
        );
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    if (showMapModal && !mapLoaded) {
      loadLeaflet();
    }
    if (showMapModal && mapLoaded) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showMapModal, mapLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/auth/signup",
        formData
      );
      setSession("token", res.data.token);
      setSession("user", res.data.user);
      navigate("/");
    } catch (err) {
      showToast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-6 p-3">
              <img
                src={LOGO}
                alt="Threadly Logo"
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? "Join Threadly" : "Complete your profile"}
            </h1>
            <p className="text-gray-600">
              {step === 1
                ? "Choose your account type to get started"
                : "Fill in your details to create your account"}
            </p>
          </div>

          <div className="px-8 pb-8">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      value: "student",
                      label: "Student",
                      desc: "Learning and enrolled in education",
                      icon: GraduationCap,
                    },
                    {
                      value: "employee",
                      label: "Employee",
                      desc: "Working professional seeking opportunities",
                      icon: User,
                    },
                    {
                      value: "company",
                      label: "Company",
                      desc: "Organization looking to hire talent",
                      icon: Building,
                    },
                  ].map((type) => (
                    <div
                      key={type.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          accountType: type.value,
                        }))
                      }
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                        formData.accountType === type.value
                          ? "border-black bg-gray-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            formData.accountType === type.value
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                          }`}
                        >
                          <type.icon size={20} />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            formData.accountType === type.value
                              ? "border-black bg-black"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {formData.accountType === type.value && (
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {type.label}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {type.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!formData.accountType}
                  className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-900 transition-all duration-200 font-medium flex items-center justify-center gap-2 group disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <span className="text-sm text-gray-600 font-medium">
                    {formData.accountType === "company"
                      ? "Company"
                      : "Personal"}{" "}
                    Details
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    {formData.accountType === "company"
                      ? "Company Name"
                      : "Full Name"}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                      {formData.accountType === "company" ? (
                        <Building
                          size={18}
                          className="text-gray-400 group-focus-within:text-gray-600"
                        />
                      ) : (
                        <User
                          size={18}
                          className="text-gray-400 group-focus-within:text-gray-600"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder={
                        formData.accountType === "company"
                          ? "Enter company name"
                          : "Enter your full name"
                      }
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {formData.accountType === "company" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      Company Address
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          handleLocationInputChange(e.target.value)
                        }
                        placeholder="Enter company address or click map icon"
                        className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-black transition-colors"
                      >
                        <MapPin size={18} />
                      </button>

                      {locationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {locationSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectSuggestion(suggestion)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0 text-sm transition-colors"
                            >
                              <div className="font-medium">
                                {suggestion.display_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                      <Mail
                        size={18}
                        className="text-gray-400 group-focus-within:text-gray-600"
                      />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                      <Lock
                        size={18}
                        className="text-gray-400 group-focus-within:text-gray-600"
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      placeholder="Create a secure password"
                      className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                      <Lock
                        size={18}
                        className="text-gray-400 group-focus-within:text-gray-600"
                      />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {formData.accountType !== "company" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Current status
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                          <MdWork
                            size={18}
                            className="text-gray-400 group-focus-within:text-gray-600"
                          />
                        </div>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select your status</option>
                          <option value="student">Student — studying</option>
                          <option value="employed">
                            Employed — currently working
                          </option>
                          <option value="looking">
                            Looking — open to opportunities
                          </option>
                          <option value="freelancer">
                            Freelancer — independent contractor
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Profession{" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                          <FaBriefcase
                            size={18}
                            className="text-gray-400 group-focus-within:text-gray-600"
                          />
                        </div>
                        <input
                          type="text"
                          name="profession"
                          value={formData.profession}
                          placeholder="e.g. Software Engineer, Graphic Designer"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-900 transition-all duration-200 font-medium flex items-center justify-center gap-2 group mt-6"
                >
                  Create Account
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-black font-medium hover:underline transition-all duration-200"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-black">
                Select Company Location
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => handleMapSearchInput(e.target.value)}
                  placeholder="Search for a location..."
                  className="w-full p-3 pl-10 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <button
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="absolute right-2 top-2 px-3 py-1 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isLoadingLocation ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation size={14} />
                  )}
                  {isLoadingLocation ? "Finding..." : "Current"}
                </button>
              </div>

              {mapSearchSuggestions.length > 0 && (
                <div className="bg-white border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  {mapSearchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectMapSuggestion(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 text-sm transition-colors"
                    >
                      <div className="font-medium truncate">
                        {suggestion.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <div className="h-full bg-gray-200 rounded-lg relative">
                <div
                  id="signup-map-container"
                  className="w-full h-full rounded-lg"
                ></div>

                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                    <div className="text-center text-gray-600">
                      <div className="w-8 h-8 border-2 border-gray-400 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                      <div>Loading map...</div>
                    </div>
                  </div>
                )}

                {selectedMarker && (
                  <div className="absolute top-4 left-4 right-4 bg-black/80 text-white rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Crosshair size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1">
                          Selected Location
                        </div>
                        <div className="text-xs break-words">
                          {searchLocation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmLocationSelection}
                disabled={!selectedMarker}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
