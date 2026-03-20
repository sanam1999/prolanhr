import './App.css';
import {  PATHS } from './Constants/Path';
import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './Pages/Home/Home';
import Profile from './Pages/Profile/Profile';
import WebVanarability from './Pages/WebAplication/Vanarability/vanarability';
import Login from './Pages/Login/Login';
import Singup from './Pages/Login/Singup';
function Body({type}) {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home type={type}/>} />
        <Route path="/Profile" element={<Profile />} />
        <Route path={PATHS.WebVanarability} element={<WebVanarability />} />
        <Route path={PATHS.Login} element={<Login />}></Route>
        <Route path={PATHS.Singup} element={<Singup/>}></Route>
      </Routes>
    </>
  );
}

export default Body;

