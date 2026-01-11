import React from 'react'
import '../styles/style.css'
import { useState } from 'react'
import { useEffect } from 'react'
import { stateDistricts } from '../utils/stateDistricts'
import "../App.css"
// import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../utils/firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export default function SignUp() {

  const navigate = useNavigate();

  const [secondForm, setSecondForm] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [districts, setDistricts] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    aadharNum: '',
    location: {
      state: '',
      district: ''
    }
  });

  const FlushText = ({ text = '', speed = 50, delay = delay, color = "rgba(201, 255, 203, 1)", size = '2rem' }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
      if (!text) return;

      const animateText = () => {
        let index = 0;
        setDisplayedText(""); // Reset text before starting new animation

        const interval = setInterval(() => {
          setDisplayedText(prev => prev + text[index]);
          index++;

          if (index === text.length - 1) {
            clearInterval(interval);
            // Wait for delay time before starting next animation
            setTimeout(animateText, delay);
          }
        }, speed);

        return () => clearInterval(interval);
      };

      // Initial delay before first animation
      const initialTimeout = setTimeout(animateText, delay);

      return () => {
        clearTimeout(initialTimeout);
      };
    }, [text, speed, delay]);

    const isMultiline = text ? text.includes("\n") : false; // Add null check here

    return isMultiline ? (
      <pre
        style={{
          fontSize: size,
          color: color,
          maxWidth: "70%",
          wordWrap: "break-word",
          margin: "0 auto",
          whiteSpace: 'pre-wrap',
          maxHeight: '90%',
        }}
      >
        {displayedText}
      </pre>
    ) : (
      <div style={{ fontSize: size, color: color }}>
        {displayedText}
      </div>
    );
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setSelectedState(true);
      const distArr = stateDistricts[value] || [];
      setDistricts(distArr);
    }
    if (name === 'state' || name === 'district') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Prepare user profile data
      const userProfile = {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        aadharNum: formData.aadharNum,
        location: formData.location,
        createdAt: new Date().toISOString(),
        role: 'farmer' // defaulting to farmer
      };

      // 3. Save to Firestore
      await setDoc(doc(db, "users", user.uid), userProfile);

      console.log("User registered:", user.uid);

      // Store token not really needed if using Firebase SDK state, but for compat:
      localStorage.setItem('user', JSON.stringify(userProfile));

      alert('Registration successful!');

      navigate(`/dashboard/${formData.aadharNum}`);

    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
    }
  };



  return (
    <div className='flex flex-row h-[100vh] w-[100vw] bg-white'>
      <div className='flushpart items-center hidden md:flex md:w-[60vw] h-full px-10'>

        <div className='hidden md:flex w-[90%] font-bold pl-4'>
          <FlushText
            text='GGrowing Dreams, Cultivating Prosperity – Smart Loans for Every Farmer'
            speed={50}
            delay={1000}
            size='4rem'></FlushText>
        </div>

      </div>

      <div className='flex items-center justify-center w-[100%] md:w-[40%] bg-lightBg px-2 md:px-6'>
        <div className='h-auto w-[95%] md:w-auto flex flex-col gap-4 px-6'>
          <h1 className='font-semibold text-primary text-xl ml-2'>Create account</h1>
          <input
            type='text'
            placeholder='Enter Firstname'
            name='firstName'  // correct, matches state
            onChange={handleInputChange}
            value={formData.firstName}
            className='p-4 rounded-xl'
          />
          <input
            type='text'
            placeholder='Enter Lastname'
            name='lastName'   // was 'Lastname', should be 'lastname'
            onChange={handleInputChange}
            value={formData.lastName}
            className='p-4 rounded-xl'
          />
          <input
            type='number'
            placeholder='Enter Mobile number'
            name='phone'
            onChange={handleInputChange}
            value={formData.phone}
            className='p-4 rounded-xl'
          />
          <input
            type='email'
            placeholder='Enter Email'
            name='email'
            onChange={handleInputChange}
            value={formData.email}
            className='p-4 rounded-xl'
          />
          <input
            type='password'
            placeholder='Enter Password'
            name='password'
            onChange={handleInputChange}
            value={formData.password}
            className='p-4 rounded-xl'
          />
          <input
            type='number'
            placeholder='Enter Aadhar number'
            name='aadharNum'  // was 'aadhar', should be 'aadharNumber'
            onChange={handleInputChange}
            value={formData.aadharNum}
            className='p-4 rounded-xl'
          />

          <div className='flex gap-2 flex-col md:flex-row md:justify-between'>
            {/* State Dropdown */}
            <select
              name='state'  // Add name attribute
              value={formData.location.state}
              onChange={handleInputChange}
              className='p-4 rounded-xl md:mr-2'
            >
              <option value="">Select State</option>
              {Object.keys(stateDistricts).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            {/* District Dropdown */}
            <select
              name='district'  // Add name attribute
              value={formData.location.district}
              onChange={handleInputChange}
              disabled={!selectedState}
              className='p-4 rounded-xl md:ml-2'
            >
              <option value="">Select District</option>
              {districts && districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          <button className='p-4 rounded-xl bg-primary text-white font-semibold' onClick={handleSubmit}>Sign Up</button>
        </div>
      </div>

    </div>
  )
}


