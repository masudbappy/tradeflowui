import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import authService from './services/authService';

const languageContent = {
  en: {
    loginTitle: "Login to the System",
    loginPrompt: "Enter your username and password",
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    loginButton: "Login",
    footerText: "© 2025 Al-Barakah Iron. All rights reserved."
  },
  bn: {
    loginTitle: "সিস্টেমে লগইন করুন",
    loginPrompt: "আপনার ইউজারনেইম ও পাসওয়ার্ড দিন",
    usernamePlaceholder: "ইউজারনেইম",
    passwordPlaceholder: "পাসওয়ার্ড",
    loginButton: "লগইন করুন",
    footerText: "© ২০২৫ আল-বারাকাহ-আয়রন। সর্বস্বত্ব সংরক্ষিত।"
  }
};

function App() {
  const [language, setLanguage] = useState('bn');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.verifyToken();
        setIsLoggedIn(isValid);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      console.log('Attempting login with:', { username }); // Don't log password
      const result = await authService.login(username, password);
      console.log('Login successful:', result);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      <div className="language-selector">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('bn')}>বাংলা</button>
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>{languageContent[language].loginTitle}</h2>
            <p>{languageContent[language].loginPrompt}</p>
          </div>
          <form id="login-form" onSubmit={handleLogin}>
            {loginError && (
              <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            <div className="input-group">
              <i className="fas fa-user"></i>
              <input 
                type="text" 
                name="username"
                placeholder={languageContent[language].usernamePlaceholder} 
                required 
              />
            </div>
            <div className="input-group">
              <i className="fas fa-lock"></i>
              <input 
                type="password" 
                name="password"
                placeholder={languageContent[language].passwordPlaceholder} 
                required 
              />
              <i className="fas fa-eye-slash" id="togglePassword"></i>
            </div>
            <button type="submit" className="login-button">
              {languageContent[language].loginButton}
            </button>
          </form>
        </div>
        <div className="footer">
          {languageContent[language].footerText}
        </div>
      </div>
    </div>
  );
}

export default App;
