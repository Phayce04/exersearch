/**
 * Location Autocomplete: Using Photon API (Free, No API Key Required)
 * Photon is a free geocoding API by Komoot - perfect for location suggestions
 * Docs: https://photon.komoot.io/
 * 
 * INSTALLATION REQUIRED:
 * npm install lucide-react
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Dumbbell, Activity, Zap, 
  Sprout, Award, Trophy,
  User, Users, UserCircle,
  MapPin, Loader2,
  Droplets, Lock, Wifi, Car, Waves, Wind,
  HeartPulse, Weight, Cog, Box, Target, Scan,
  Sunrise, Sun, Moon,
  UtensilsCrossed, Leaf, Salad, Church, Milk, Wheat
} from 'lucide-react';
import './Onboardingstyle.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    fitnessGoal: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    fitnessLevel: '',
    location: '',
    gymBudget: '',
    amenities: [],
    equipment: [],
    workoutDays: '',
    workoutTime: '',
    foodBudget: '',
    dietaryRestrictions: [],
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    passwordsMatch: false
  });

  // Location suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch location suggestions from Photon API
  const fetchLocationSuggestions = async (query) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lon=121.0437&lat=14.5547`
      );
      const data = await response.json();
      
      const suggestions = data.features.map(feature => ({
        name: feature.properties.name || '',
        city: feature.properties.city || feature.properties.county || '',
        display: `${feature.properties.name || ''}, ${feature.properties.city || feature.properties.county || ''}`.replace(/^, |, $/g, '')
      }));
      
      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Validate password
  useEffect(() => {
    const pwd = formData.password;
    const confirmPwd = formData.confirmPassword;

    setPasswordValidation({
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      passwordsMatch: pwd.length > 0 && pwd === confirmPwd
    });
  }, [formData.password, formData.confirmPassword]);

  const questions = [
    {
      id: 'fitnessGoal',
      type: 'single-choice',
      question: "What's your main goal?",
      options: [
        { value: 'lose_weight', icon: Flame, label: 'Lose Weight' },
        { value: 'build_muscle', icon: Dumbbell, label: 'Build Muscle' },
        { value: 'stay_fit', icon: Activity, label: 'Stay Fit' },
        { value: 'athletic', icon: Zap, label: 'Get Athletic' }
      ]
    },
    {
      id: 'fitnessLevel',
      type: 'single-choice',
      question: "Current fitness level?",
      options: [
        { value: 'beginner', icon: Sprout, label: 'Beginner' },
        { value: 'intermediate', icon: Award, label: 'Intermediate' },
        { value: 'advanced', icon: Trophy, label: 'Advanced' }
      ]
    },
    {
      id: 'age',
      type: 'input',
      question: "How old are you?",
      inputType: 'number',
      placeholder: '25',
      unit: 'years'
    },
    {
      id: 'gender',
      type: 'single-choice',
      question: "Gender?",
      options: [
        { value: 'male', icon: User, label: 'Male' },
        { value: 'female', icon: Users, label: 'Female' },
        { value: 'other', icon: UserCircle, label: 'Other' }
      ]
    },
    {
      id: 'height',
      type: 'input',
      question: "Your height?",
      inputType: 'number',
      placeholder: '170',
      unit: 'cm'
    },
    {
      id: 'weight',
      type: 'input',
      question: "Current weight?",
      inputType: 'number',
      placeholder: '70',
      unit: 'kg'
    },
    {
      id: 'location',
      type: 'input-autocomplete',
      question: "Where are you in Pasig?",
      inputType: 'text',
      placeholder: 'Start typing your location...'
    },
    {
      id: 'gymBudget',
      type: 'single-choice',
      question: "Daily gym budget?",
      options: [
        { value: '50', label: '₱50 below' },
        { value: '100', label: '₱100' },
        { value: '150', label: '₱150' },
        { value: '200', label: '₱200' },
        { value: '500', label: '₱500+' }
      ]
    },
    {
      id: 'amenities',
      type: 'multi-choice',
      question: "Gym amenities needed?",
      options: [
        { value: 'AC', icon: Wind, label: 'AC' },
        { value: 'Shower', icon: Droplets, label: 'Shower' },
        { value: 'Locker', icon: Lock, label: 'Locker' },
        { value: 'WiFi', icon: Wifi, label: 'WiFi' },
        { value: 'Pool', icon: Waves, label: 'Pool' },
        { value: 'Sauna', icon: Flame, label: 'Sauna' },
        { value: 'Parking', icon: Car, label: 'Parking' }
      ]
    },
    {
      id: 'equipment',
      type: 'multi-choice',
      question: "Equipment you use?",
      options: [
        { value: 'Cardio', icon: HeartPulse, label: 'Cardio' },
        { value: 'Weights', icon: Weight, label: 'Weights' },
        { value: 'Machines', icon: Cog, label: 'Machines' },
        { value: 'Functional', icon: Target, label: 'Functional' },
        { value: 'Boxing', icon: Box, label: 'Boxing' },
        { value: 'Yoga', icon: Scan, label: 'Yoga' }
      ]
    },
    {
      id: 'workoutDays',
      type: 'single-choice',
      question: "Training days per week?",
      options: [
        { value: '3', label: '3 days' },
        { value: '4', label: '4 days' },
        { value: '5', label: '5 days' },
        { value: '6', label: '6 days' },
        { value: '7', label: 'Every day' }
      ]
    },
    {
      id: 'workoutTime',
      type: 'single-choice',
      question: "Preferred workout time?",
      options: [
        { value: 'morning', icon: Sunrise, label: 'Morning' },
        { value: 'afternoon', icon: Sun, label: 'Afternoon' },
        { value: 'evening', icon: Moon, label: 'Evening' }
      ]
    },
    {
      id: 'foodBudget',
      type: 'single-choice',
      question: "Daily food budget?",
      options: [
        { value: '200', label: '₱200' },
        { value: '300', label: '₱300' },
        { value: '500', label: '₱500' },
        { value: '1000', label: '₱1000+' }
      ]
    },
    {
      id: 'dietaryRestrictions',
      type: 'multi-choice',
      question: "Dietary restrictions?",
      options: [
        { value: 'None', icon: UtensilsCrossed, label: 'None' },
        { value: 'Vegan', icon: Leaf, label: 'Vegan' },
        { value: 'Vegetarian', icon: Salad, label: 'Vegetarian' },
        { value: 'Halal', icon: Church, label: 'Halal' },
        { value: 'Lactose', icon: Milk, label: 'Lactose Free' },
        { value: 'Gluten', icon: Wheat, label: 'Gluten Free' }
      ]
    },
    {
      id: 'name',
      type: 'input',
      question: "What's your name?",
      inputType: 'text',
      placeholder: 'Juan Dela Cruz'
    },
    {
      id: 'email',
      type: 'input',
      question: "Your email?",
      inputType: 'email',
      placeholder: 'juan@email.com'
    },
    {
      id: 'password',
      type: 'input-password',
      question: "Create a password",
      inputType: 'password',
      placeholder: 'Enter password'
    },
    {
      id: 'confirmPassword',
      type: 'input-password-confirm',
      question: "Confirm password",
      inputType: 'password',
      placeholder: 'Re-enter password'
    }
  ];

  const handleSingleChoice = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question after a brief delay
    setTimeout(() => {
      nextQuestion();
    }, 300);
  };

  const handleMultiChoice = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: prev[questionId].includes(value)
        ? prev[questionId].filter(item => item !== value)
        : [...prev[questionId], value]
    }));
  };

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
    
    // If it's location input, fetch suggestions
    if (questionId === 'location') {
      // Debounce the API call
      if (inputRef.current) {
        clearTimeout(inputRef.current);
      }
      inputRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 300);
    }
  };

  const handleLocationSelect = (suggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.display }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  // Get user's current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode using Photon API
        try {
          const response = await fetch(
            `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const place = data.features[0].properties;
            const locationName = `${place.name || ''}, ${place.city || place.county || ''}`.replace(/^, |, $/g, '');
            setFormData(prev => ({ ...prev, location: locationName }));
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          alert('Could not get location name. Please type it manually.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location access denied. Please enable location permissions and try again.');
        } else {
          alert('Could not get your location. Please type it manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    // Validate password before submitting
    const allValid = Object.values(passwordValidation).every(v => v);
    if (!allValid) {
      alert('Please ensure your password meets all requirements and passwords match.');
      return;
    }

    console.log('Form submitted:', formData);
    // TODO: Send to backend API
    // await axios.post('/api/register', formData);
    
    // Show success screen
    setShowSuccess(true);
  };

  const handleRedirectToLogin = () => {
    navigate('/login'); // Change to your login route
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && questions[currentQuestion].type.includes('input')) {
      const value = formData[questions[currentQuestion].id];
      if (value && value.trim()) {
        if (currentQuestion === questions.length - 1) {
          handleSubmit();
        } else {
          nextQuestion();
        }
      }
    }
  };

  const canProceedPassword = () => {
    if (currentQ.type === 'input-password') {
      return formData.password.length > 0;
    }
    if (currentQ.type === 'input-password-confirm') {
      return Object.values(passwordValidation).every(v => v);
    }
    return true;
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  // Success Screen
  if (showSuccess) {
    return (
      <div className="success-screen">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h1>You're All Set!</h1>
          <p>Your personalized fitness plan is ready</p>
          <button className="success-btn" onClick={handleRedirectToLogin}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-minimal">
      {/* Progress Bar */}
      <div className="progress-dots">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Top Controls */}
      <div className="top-controls">
        <button 
          className="back-btn"
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
        >
          ←
        </button>
        <span className="question-counter">
          {currentQuestion + 1}/{questions.length}
        </span>
      </div>

      {/* Question Container */}
      <div className={`question-container ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="question-content">
          <h1 className="question-title">{currentQ.question}</h1>

          {/* Single Choice */}
          {currentQ.type === 'single-choice' && (
            <div className="choices-container">
              {currentQ.options.map(option => {
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`choice-card ${formData[currentQ.id] === option.value ? 'selected' : ''}`}
                    onClick={() => handleSingleChoice(currentQ.id, option.value)}
                  >
                    {IconComponent && (
                      <div className="choice-icon">
                        <IconComponent size={28} strokeWidth={2.5} />
                      </div>
                    )}
                    <span className="choice-label">{option.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Multi Choice */}
          {currentQ.type === 'multi-choice' && (
            <>
              <div className="choices-container multi">
                {currentQ.options.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`choice-card multi ${formData[currentQ.id].includes(option.value) ? 'selected' : ''}`}
                      onClick={() => handleMultiChoice(currentQ.id, option.value)}
                    >
                      {IconComponent && (
                        <div className="choice-icon">
                          <IconComponent size={32} strokeWidth={2.5} />
                        </div>
                      )}
                      <span className="choice-label">{option.label}</span>
                      <div className="checkbox">
                        {formData[currentQ.id].includes(option.value) && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {formData[currentQ.id].length > 0 && (
                <button className="continue-btn" onClick={nextQuestion}>
                  Continue
                </button>
              )}
            </>
          )}

          {/* Regular Input */}
          {currentQ.type === 'input' && (
            <>
              <div className="input-wrapper">
                <input
                  type={currentQ.inputType}
                  placeholder={currentQ.placeholder}
                  value={formData[currentQ.id]}
                  onChange={(e) => handleInputChange(currentQ.id, e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className={`input-field ${currentQ.unit ? 'has-unit' : ''}`}
                />
                {currentQ.unit && <span className="input-unit">{currentQ.unit}</span>}
              </div>
              {formData[currentQ.id] && (
                <button className="continue-btn" onClick={nextQuestion}>
                  Continue
                </button>
              )}
            </>
          )}

          {/* Location Autocomplete Input */}
          {currentQ.type === 'input-autocomplete' && (
            <>
              <div className="location-input-container">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder={currentQ.placeholder}
                    value={formData[currentQ.id]}
                    onChange={(e) => handleInputChange(currentQ.id, e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="input-field"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="location-suggestions">
                      {locationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="location-suggestion"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          {suggestion.display}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className={`get-location-btn ${isGettingLocation ? 'loading' : ''}`}
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  title="Get my current location"
                >
                  {isGettingLocation ? (
                    <Loader2 size={24} className="spin-icon" />
                  ) : (
                    <MapPin size={24} />
                  )}
                </button>
              </div>
              {formData[currentQ.id] && (
                <button className="continue-btn" onClick={nextQuestion}>
                  Continue
                </button>
              )}
            </>
          )}

          {/* Password Input */}
          {currentQ.type === 'input-password' && (
            <>
              <div className="input-wrapper">
                <input
                  type={currentQ.inputType}
                  placeholder={currentQ.placeholder}
                  value={formData[currentQ.id]}
                  onChange={(e) => handleInputChange(currentQ.id, e.target.value)}
                  autoFocus
                  className="input-field"
                />
              </div>
              
              {formData.password && (
                <div className="password-requirements">
                  <div className={`requirement ${passwordValidation.minLength ? 'valid' : ''}`}>
                    {passwordValidation.minLength ? '✓' : '○'} At least 8 characters
                  </div>
                  <div className={`requirement ${passwordValidation.hasUpper ? 'valid' : ''}`}>
                    {passwordValidation.hasUpper ? '✓' : '○'} One uppercase letter
                  </div>
                  <div className={`requirement ${passwordValidation.hasLower ? 'valid' : ''}`}>
                    {passwordValidation.hasLower ? '✓' : '○'} One lowercase letter
                  </div>
                  <div className={`requirement ${passwordValidation.hasNumber ? 'valid' : ''}`}>
                    {passwordValidation.hasNumber ? '✓' : '○'} One number
                  </div>
                </div>
              )}

              {canProceedPassword() && (
                <button className="continue-btn" onClick={nextQuestion}>
                  Continue
                </button>
              )}
            </>
          )}

          {/* Confirm Password Input */}
          {currentQ.type === 'input-password-confirm' && (
            <>
              <div className="input-wrapper">
                <input
                  type={currentQ.inputType}
                  placeholder={currentQ.placeholder}
                  value={formData[currentQ.id]}
                  onChange={(e) => handleInputChange(currentQ.id, e.target.value)}
                  autoFocus
                  className="input-field"
                />
              </div>

              {formData.confirmPassword && (
                <div className="password-requirements">
                  <div className={`requirement ${passwordValidation.passwordsMatch ? 'valid' : 'invalid'}`}>
                    {passwordValidation.passwordsMatch ? '✓' : '✗'} Passwords match
                  </div>
                </div>
              )}

              {canProceedPassword() && (
                <button className="continue-btn" onClick={handleSubmit}>
                  Create Account
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}