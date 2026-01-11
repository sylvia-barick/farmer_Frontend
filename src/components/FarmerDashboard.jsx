import { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Leaf,
  Download,
  FileText,
  TrendingUp,
  Cloud,
  Sun,
  CloudRain,
  LogOut,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  MessageCircle,
  Edit2, // Added Edit icon
  X, // Added Close icon
  Save // Added Save icon
} from "lucide-react";
import { useParams } from 'react-router-dom';
import YieldPredictionForm from "./YieldPredictionForm";
import YieldResults from "./YieldResult";
import LoanApplication from "./loanApplication";
import InsuranceClaim from "./insuranceClaim";
import PlantDisease from "./PlantDisease";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import PastReports from "./pastRecords";
import KisaanSaathi from "./kisaanSaathi";
import { Menu } from 'lucide-react';
import axios from 'axios';
import { getWeather, getFarmSummary } from '../services/backendApi'; // Import new services
import FarmMap from './FarmMap';

const FarmerDashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [yieldResults, setYieldResults] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [farmingNews, setFarmingNews] = useState();
  const navigate = useNavigate();

  // State for Editable Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // State for AI Summary
  const [farmSummary, setFarmSummary] = useState("Loading farm summary...");

  const [userData, setUserData] = useState({
    uid: '',
    name: '',
    email: '',
    totalLand: 0,
    crops: [],
    locationLat: '',
    locationLong: '',
    isSmallFarmer: false,
    phone: '',
    aadhar: '',
  });

  const { id } = useParams();

  const [isMobile, setIsMobile] = useState(false);

  const [displayData, setDisplayData] = useState({
    user: {
      uid: '' || 'd7m74KoesWRw9bdXceJboC7vbUu1',
      name: '' || 'Debangshu Chatterjee',
      email: '' || 'debangshuchatterjee2005@gmail.com',
      totalLand: 0 || 10,
      crops: [] || ['Wheat', 'Rice', 'Maize'],
      locationLat: '' || 22.5726,
      locationLong: '' || 88.3639,
      isSmallFarmer: false || true,
      phone: '' || '9876543210',
      aadhar: '' || '123456789012',
    }
  });

  const getDateRange = () => {
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (`0${date.getMonth() + 1}`).slice(-2); // Months are 0-based
      const day = (`0${date.getDate()}`).slice(-2);
      return `${year}-${month}-${day}`;
    };

    return {
      endDate: formatDate(today),
      startDate: formatDate(fourteenDaysAgo),
    };
  }

  useEffect(() => {
    console.log("Starting news API call...");
    const { endDate, startDate } = getDateRange();

    axios.get(`https://newsdata.io/api/1/latest?apikey=${import.meta.env.VITE_NEWS_API}&q=indian%20agriculture`)
      .then((response) => {
        console.log("News API response received:", response);
        setNewsData(response.data);
        console.log("News data : ", response.data);
      })
      .catch((error) => {
        console.error("News API error:", error);
        console.error("Error details:", error.response?.data || error.message);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleYieldPrediction = (results) => {
    setYieldResults(results);
    setActiveSection('results');
  };

  useEffect(() => {
    let hasFetched = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (hasFetched) return;
      hasFetched = true;

      const uidToUse = user ? user.uid : id;

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/dashboard/${uidToUse}`);
        const data = await response.json();
        setUserData(data);
        setDisplayData(data);
      } catch (error) {
        console.error('Error fetching farmer data:', error);

        try {
          const dummy_data = JSON.parse(localStorage.getItem("mock_userData"));
          if (dummy_data) {
            setDisplayData(dummy_data);
            console.log("Using mock data from localStorage.");
          } else {
            const fallbackData = {
              user: {
                uid: 'd7m74KoesWRw9bdXceJboC7vbUu1',
                name: 'Debangshu Chatterjee',
                email: 'debangshuchatterjee2005@gmail.com',
                totalLand: 5,
                crops: ['Wheat', 'Rice', 'Maize'],
                locationLat: 22.5726,
                locationLong: 88.3639,
                isSmallFarmer: true,
                phone: '6290277345',
                aadhar: '123456789012',
              }
            };
            setDisplayData(fallbackData);
            localStorage.setItem("mock_userData", JSON.stringify(fallbackData));
          }
        } catch (localStorageError) {
          console.error('LocalStorage fallback failed:', localStorageError);
        }
      }
    });

    return () => {
      unsubscribe();
      console.log('Unsubscribed from Firebase Auth listener.');
    };
  }, []);

  function getRelativeTime(pubDate) {
    const now = new Date();
    const published = new Date(pubDate);
    const diffMs = now - published;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `Just now`;
  }

  // Safely generate the farmingNews array from newsData
  useEffect(() => {
    if (!newsData || !newsData.results) return;

    const mappedNews = newsData.results.slice(0, 10).map((item) => ({
      title: item.title || "Some_random_title",
      time: getRelativeTime(item.pubDate),
      type: newsData.source_name || "general",
    }));

    setFarmingNews(mappedNews);
  }, [newsData]);


  const [weatherForecast, setWeatherForecast] = useState([]);

  useEffect(() => {
    const fetchWeatherAndSummary = async () => {
      // Prioritize explicit lat/long, or user data, or default
      const lat = displayData.user.locationLat || 22.5726;
      const lon = displayData.user.locationLong || 88.3639;

      try {
        const data = await getWeather(lat, lon);
        if (data && data.success && data.data) {
          // Mocking 7-day structure if API returns limited data, otherwise map real data.
          // Accessing Tomorrow.io 'timelines.daily'
          const rawDaily = data.data.timelines?.daily || [];

          // If API gives us daily data, map it. Otherwise mock 7 days based on current.
          let dailyData = rawDaily.length > 0 ? rawDaily.slice(0, 7) :
            Array(7).fill(null).map((_, i) => ({
              time: new Date(Date.now() + i * 86400000).toISOString(),
              values: { temperatureAvg: 25 + Math.random() * 5, cloudCover: Math.random() * 100 }
            }));

          const mappedWeather = dailyData.map(day => ({
            date: new Date(day.time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            temp: `${Math.round(day.values.temperatureAvg)}°C`,
            condition: day.values.cloudCover > 50 ? (day.values.rainIntensityAvg > 0 ? "Rainy" : "Cloudy") : "Sunny",
            icon: day.values.cloudCover > 50 ? (day.values.rainIntensityAvg > 0 ? CloudRain : Cloud) : Sun
          }));

          setWeatherForecast(mappedWeather);

          // Generate AI Summary only if we have weather and user data
          const summary = await getFarmSummary(displayData.user, mappedWeather);
          setFarmSummary(summary);

        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
        setWeatherForecast(Array(7).fill({ date: 'Tx err', temp: '--', condition: 'Error', icon: Cloud }));
        setFarmSummary("Could not generate summary due to weather data error.");
      }
    }
    fetchWeatherAndSummary();
  }, [displayData.user.locationLat, displayData.user.locationLong, displayData.user.name]);

  // Handle Edit Profile
  const openEditModal = () => {
    setEditFormData({
      name: displayData.user.name,
      totalLand: displayData.user.totalLand,
      crops: displayData.user.crops.join(', '), // Edit as comma-separated string
      locationLat: displayData.user.locationLat,
      locationLong: displayData.user.locationLong
    });
    setIsEditingProfile(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    // Optimistic update
    const updatedUser = {
      ...displayData.user,
      ...editFormData,
      crops: editFormData.crops.split(',').map(c => c.trim()).filter(c => c)
    };
    setDisplayData({ ...displayData, user: updatedUser });
    setIsEditingProfile(false);
    // TODO: Call backend to persist changes
  };


  return (
    <div className="min-h-screen bg-agricultural-soft-sand">

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-agricultural-soil-brown">Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-agricultural-forest-green outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Land (Acres)</label>
                <input type="number" name="totalLand" value={editFormData.totalLand} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-agricultural-forest-green outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crops (comma separated)</label>
                <input type="text" name="crops" value={editFormData.crops} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-agricultural-forest-green outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="text" name="locationLat" value={editFormData.locationLat} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-agricultural-forest-green outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="text" name="locationLong" value={editFormData.locationLong} onChange={handleEditChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-agricultural-forest-green outline-none" />
                </div>
              </div>
              <button onClick={saveProfile} className="w-full bg-agricultural-forest-green text-white py-2 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="bg-white border-b border-agricultural-stone-gray/20 px-6 py-4">
        {/* ... (Keep existing nav) ... */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Leaf className="h-8 w-8 text-agricultural-forest-green" />
            <span className="text-xl font-bold text-agricultural-soil-brown">AgroSure</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="inline-flex lg:hidden items-center justify-center whitespace-nowrap rounded-md 
              text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
              disabled:opacity-50 border border-agricultural-stone-gray bg-white text-agricultural-soil-brown h-10 px-4 py-2 
              hover:bg-agricultural-soft-sand"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md 
              text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
              disabled:opacity-50 border border-agricultural-stone-gray bg-white text-agricultural-soil-brown h-10 px-4 py-2 
              hover:bg-agricultural-stone-gray/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} bg-white border-r border-agricultural-stone-gray/20 overflow-auto transition-all duration-300 ease-in-out`}>
          <div className={`${sidebarCollapsed ? 'opacity-0' : 'opacity-100'} p-6 overflow-y-auto transition-opacity duration-300`}>
            {/* User Profile */}
            <div className="text-center mb-8 relative group">
              <button onClick={openEditModal} className="absolute top-0 right-0 p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Edit Profile">
                <Edit2 className="h-4 w-4 text-gray-600" />
              </button>
              <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full mx-auto mb-4 border-2 border-agricultural-forest-green/20">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-agricultural-forest-green text-white text-xl">
                  {displayData?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-agricultural-soil-brown mb-1">
                {displayData?.user?.name}
              </h2>
              <p className="text-agricultural-stone-gray text-sm mb-3">
                ID: FARMER#1001
              </p>

              {/* User Stats */}
              <div className="space-y-3">
                <div className="bg-agricultural-soft-sand rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-agricultural-stone-gray">Acres Owned:</span>
                    <span className="font-semibold text-agricultural-forest-green">{displayData?.user?.totalLand || 0} acres</span>
                  </div>
                </div>

                <div className="bg-agricultural-soft-sand rounded-lg p-3">
                  <div className="text-sm mb-2 text-agricultural-stone-gray">Crops Farmed:</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {displayData?.user?.crops?.map((crop, index) => (
                      <span key={index} className="inline-flex items-center rounded-full border bg-agricultural-crop-green/10 px-2.5 py-0.5 text-xs font-semibold text-agricultural-crop-green">
                        {crop}
                      </span>
                    )) || <span className="text-agricultural-stone-gray text-xs">No crops added</span>}
                  </div>
                </div>

                <div className="bg-agricultural-soft-sand rounded-lg p-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-agricultural-stone-gray mr-2" />
                    <span className="text-agricultural-soil-brown truncate">
                      {displayData?.user?.locationLat && displayData?.user?.locationLong
                        ? `${Number(displayData?.user?.locationLat).toFixed(4)}, ${Number(displayData?.user?.locationLong).toFixed(4)}`
                        : 'Location not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-agricultural-stone-gray/20 h-[1px] w-full mb-6" role="separator" />

            {/* Navigation Menu (Kept same logic, just condensed for readability) */}
            <div className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'prediction', label: 'New Prediction', icon: TrendingUp },
                { id: 'loan-application', label: 'Loan Application', icon: CreditCard },
                { id: 'insurance-claim', label: 'Insurance Claim', icon: Shield },
                { id: 'past-reports', label: 'Past Reports', icon: FileText },
                { id: 'plant-disease', label: 'Plant Doctor', icon: Leaf },
                { id: 'kisaan-saathi', label: 'Kisaan Saathi', icon: MessageCircle }
              ].map((item) => (
                <button
                  key={item.id}
                  className={`inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 w-full justify-start transition-colors ${activeSection === item.id
                    ? 'bg-agricultural-forest-green text-white hover:bg-agricultural-forest-green/90'
                    : 'text-agricultural-soil-brown hover:bg-agricultural-soft-sand'
                    }`}
                  onClick={() => {
                    if (isMobile) setSidebarCollapsed(true);
                    setActiveSection(item.id);
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'dashboard' && (
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-agricultural-soil-brown mb-2">
                  Welcome back, {displayData?.user?.name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-agricultural-stone-gray">
                  Here's what's happening with your farm today
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Feed and Quick Actions */}
                <div className="lg:col-span-2 space-y-8">

                  {/* AI Farm Summary */}
                  <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="flex items-center text-xl font-semibold leading-none text-agricultural-soil-brown">
                        <Leaf className="h-5 w-5 mr-2 text-agricultural-forest-green" />
                        Daily Farm Insight
                      </h3>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                        {farmSummary}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">Quick Actions</h3>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white h-auto py-4 flex-col space-y-2 transition-colors"
                          onClick={() => setActiveSection('prediction')}
                        >
                          <TrendingUp className="h-6 w-6" />
                          <span>New Yield Prediction</span>
                        </button>
                        <button
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-agricultural-stone-gray bg-white text-agricultural-soil-brown h-auto py-4 flex-col space-y-2 hover:bg-agricultural-soft-sand transition-colors"
                          onClick={() => setActiveSection('loan-application')}
                        >
                          <Download className="h-6 w-6" />
                          <span>Apply for Loan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Farming Feed */}
                  <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="flex items-center text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                        <Calendar className="h-5 w-5 mr-2" />
                        Agricultural News
                      </h3>
                    </div>
                    <div className="p-6 pt-0 max-h-[40vh] overflow-y-auto space-y-4 custom-scrollbar">
                      {farmingNews?.map((news, index) => (
                        <div key={index} className="border-b border-agricultural-stone-gray/20 last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-agricultural-soil-brown text-sm line-clamp-2">
                              {news.title}
                            </h3>
                            <span className="text-xs text-agricultural-stone-gray whitespace-nowrap ml-2">{news.time}</span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${news.type === 'price-update' ? 'border-agricultural-crop-green text-agricultural-crop-green' :
                              news.type === 'policy' ? 'border-agricultural-harvest-gold text-agricultural-harvest-gold' :
                                'border-agricultural-drought-orange text-agricultural-drought-orange'
                              }`}
                          >
                            {news.type.replace('-', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Map, Weather, Summary */}
                <div className="lg:col-span-1 space-y-6">

                  {/* Map Widget */}
                  <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="flex items-center text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                        <MapPin className="h-5 w-5 mr-2" />
                        Farm Location
                      </h3>
                    </div>
                    <div className="p-4 pt-0">
                      {displayData.user.locationLat && displayData.user.locationLong ? (
                        <FarmMap lat={displayData.user.locationLat} lon={displayData.user.locationLong} />
                      ) : (
                        <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center rounded-lg">
                          <span className="text-gray-500">Location not set</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weather Forecast Widget (7 Days) */}
                  <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="flex items-center text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                        <Cloud className="h-5 w-5 mr-2" />
                        7-Day Forecast
                      </h3>
                    </div>
                    <div className="p-6 pt-0 space-y-3">
                      {weatherForecast.length > 0 ? (
                        weatherForecast.map((day, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-agricultural-soft-sand rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                              <day.icon className="h-5 w-5 text-agricultural-forest-green" />
                              <div>
                                <div className="font-medium text-agricultural-soil-brown text-sm">
                                  {day.date}
                                </div>
                                <div className="text-xs text-agricultural-stone-gray">{day.condition}</div>
                              </div>
                            </div>
                            <div className="font-semibold text-agricultural-soil-brown">{day.temp}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">Loading forecast...</div>
                      )}
                    </div>
                  </div>

                  {/* Farm Summary */}
                  <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">Farm Stats</h3>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-agricultural-stone-gray">Total Land:</span>
                          <span className="font-semibold text-agricultural-soil-brown">{displayData?.user?.totalLand || 0} acres</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agricultural-stone-gray">Active Crops:</span>
                          <span className="font-semibold text-agricultural-soil-brown">{displayData?.user?.crops?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agricultural-stone-gray">Reports Generated:</span>
                          <span className="font-semibold text-agricultural-crop-green">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agricultural-stone-gray">Success Rate:</span>
                          <span className="font-semibold text-agricultural-crop-green">94%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeSection === 'prediction' && (
            <div className="p-8">
              <YieldPredictionForm
                user={displayData?.user || {}}
                onPredictionComplete={handleYieldPrediction}
              />
            </div>
          )
          }

          {
            activeSection === 'loan-application' && (
              <LoanApplication
                user={displayData?.user || {}}
                onBack={() => setActiveSection('dashboard')}
              />
            )
          }

          {
            activeSection === 'insurance-claim' && (
              <InsuranceClaim
                user={displayData?.user || {}}
                onBack={() => setActiveSection('dashboard')}
              />
            )
          }

          {
            activeSection === 'results' && yieldResults && (
              <div className="p-8">
                <YieldResults
                  results={yieldResults}
                  user={displayData?.user || {}}
                  onBackToDashboard={() => setActiveSection('dashboard')}
                />
              </div>
            )
          }
          {
            activeSection === 'kisaan-saathi' && (
              <KisaanSaathi
                onBack={() => setActiveSection('dashboard')}
              />
            )
          }

          {
            activeSection === 'past-reports' && (
              <PastReports
                user={displayData?.user || {}}
                onBack={() => setActiveSection('dashboard')}
              />
            )
          }

          {
            activeSection === 'plant-disease' && (
              <PlantDisease
                onBack={() => setActiveSection('dashboard')}
              />
            )
          }
        </div >
      </div >
    </div >
  );
};

export default FarmerDashboard;