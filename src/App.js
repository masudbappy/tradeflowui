import React, { useState } from 'react';
import './App.css';

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

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

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
          <form id="login-form">
            <div className="input-group">
              <i className="fas fa-user"></i>
              <input type="text" placeholder={languageContent[language].usernamePlaceholder} required />
            </div>
            <div className="input-group">
              <i className="fas fa-lock"></i>
              <input type="password" placeholder={languageContent[language].passwordPlaceholder} required />
              <i className="fas fa-eye-slash" id="togglePassword"></i>
            </div>
            <button type="submit" className="login-button">{languageContent[language].loginButton}</button>
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
