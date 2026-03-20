import './index.css';
import Body from './Body.jsx'
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from './Components/Sidebar/Sidebar.jsx';
import Header from './Components/Header/Header.jsx';
import './App.css';
import { useState } from 'react';

function App() {
  const [type, settype] = useState("All");

  return (

     <Router>
  <div className="app-layout">
    <Header className="header" />
    <Sidebar className="sidebar" type={type} settype={settype} />
    <Body className="main" type={type}/>
  </div>
</Router>

  );
}

export default App;