import React, { useState } from 'react';
import logo from '../assets/arte_red_yellow.png';

import { Link, useHistory } from 'react-router-dom';

const Login = (props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { verifyjwt } = props;

  // let history = useHistory();

  function handleUserChange(e) {
    setUsername(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function login(e) {
    e.preventDefault();

    fetch('login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
      .then((data) => data.json())
      .then((myJson) => {
        if (myJson.success) {
          document.cookie = 'token=' + myJson.token;
          verifyjwt();
          // history.push('/metrics');
          window.location.assign('/');
        }
      })
      .catch((err) => console.log("error logging in"));
  }

  return (
    <div class="loginpanel">
      <img className="logo" src={logo} />
      {/* <h2>arteMetrics</h2> <br></br> */}
      <p id="loginBanner">Login to arteMetrics</p>
      <form onSubmit={login}>
        <label for="username" translate-context="Label" translate></label>
        <input
          type="text"
          id="loginUsername"
          name="username"
          required
          placeholder="Username"
          onChange={handleUserChange}
        />
        <br />
        <label for="password" translate-context="Password" translate></label>
        <input
          type="password"
          id="loginPassword"
          name="password"
          required
          placeholder="Password"
          onChange={handlePasswordChange}
        />
        <br />
        <input type="submit" id="loginSubmitButton" value="LOGIN" />
      </form>
      <Link to="/createaccount">
        <button to="/createaccount" id="createAccountButton">
          Create Account
        </button>
      </Link>
    </div>
  );
};

export default Login;
