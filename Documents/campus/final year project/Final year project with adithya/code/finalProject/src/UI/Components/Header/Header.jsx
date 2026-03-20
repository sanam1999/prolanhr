import './Header.css';
import { FaShieldAlt} from "react-icons/fa";
import { useState } from "react";
import { PATHS } from '../../Constants/Path';
import { Link } from 'react-router-dom';
function Header() {
// const [user , setuser] = useState({name:"Sanam Shrestha",image:"https://static.vecteezy.com/system/resources/thumbnails/000/439/863/small_2x/Basic_Ui__28186_29.jpg"})
const [user , setuser] = useState()
  return (
    <header className="header">
        <div className="right">
          <span className="mainIcon">
          <FaShieldAlt size={30}/>
          <p>All in One</p>
          </span>
          
        </div>
        <div className="left">
           {user ? 
           <div className='cont'>
           <div className='user'>
            <img className="profile" src={user.image}></img>
            <p> {user.name} </p>
           </div>
           <button className="btn logout">Logout</button>
           </div>
           :
          <div>
            <Link to={PATHS.Login}>
              <button className="login btn">Login</button>
            </Link>
            <Link to={PATHS.Singup}>
              <button className="singup btn">Singup</button>
              </Link>
           </div>}
        </div>
    </header>
  );
}

export default Header;