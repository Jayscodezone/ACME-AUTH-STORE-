import { useState, useEffect } from 'react'

const Login = ({ login, loginErr, setLoginErr})=> {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = ev => {
    ev.preventDefault();
    login({ username, password });
    setLoginErr(null);
  }
  return (
    <form onSubmit={ submit }>
      <input value={ username } placeholder='username' onChange={ ev=> setUsername(ev.target.value)}/>
      <input value={ password} placeholder='password' onChange={ ev=> setPassword(ev.target.value)}/>
      {loginErr && <p className="error-msg">{loginErr}</p>}
      <button disabled={ !username || !password }>Login</button>
    </form>
  );
}

const Register = ({ register, regErr, setRegErr }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
 
  const submit = (ev) => {
    if (password.length < 4){
      setTimeout(() => setRegErr("Password must be at least 4 characters."), 3000);
    }
    ev.preventDefault();
    register({ username, password });
    setRegErr(null);
  };
  return (
    <form onSubmit={submit}>
      <input value={username} placeholder="username" onChange={(ev) => setUsername(ev.target.value)}
      />
      <input value={password} placeholder="password" onChange={(ev) => setPassword(ev.target.value)} minLength={8}
      />
      <ul>
        <li>Password must contain at least 8 characters.</li>
      </ul>
      {regErr && <p className="error-msg">{regErr}</p>}
      <button disabled={!username || !password}>Register</button>
    </form>
  );
};

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loginErr, setLoginErr] = useState(null);
  const [regErr, setRegErr] = useState(null);
  const [userAccount, setUserAccount] = useState(false);

  useEffect(() => {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async () => {
    const token = window.localStorage.getItem('token');
    if (token) {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `${token}`,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setAuth(json);
      } else {
        setLoginErr("Login unsuccessful, please try again.");
        window.localStorage.removeItem('token');
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products');
      const json = await response.json();
      setProducts(json);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${auth.id}/favorites`, {
        headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      });
      const json = await response.json();
      if (response.ok) {
        setFavorites(json);
      }
    };
    if (auth.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [auth]);

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json();
    if (response.ok) {
      window.localStorage.setItem('token', json.token);
      attemptLoginWithToken();
    } else {
      setLoginErr(json.error || "Login failed. Please try again.");
    }
  };

  const register = async (credentials) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    if (response.ok) {
      await login(credentials);
    } else {
      setRegErr("User Account already exists, please try again with existing account.");
    }
  };

  const addFavorite = async (product_id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/users/${auth.id}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ product_id }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`,
      },
    });
    const json = await response.json();
    if (response.ok) {
      setFavorites([...favorites, json]);
    } else {
      console.log(json);
    }
  };

  const removeFavorite = async (id) => {
    const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
      method: 'DELETE',
    });
    const json = await response.json();
    if (response.ok) {
      setFavorites(favorites.filter(favorite => favorite.id !== id));
    } else {
      console.log(json);
    }
  };

  const logout = () => {
    window.localStorage.removeItem('token');
    setAuth({});
  };

  const handleClick = () => {
    setUserAccount(!userAccount);
  };

  return (
    <>
      {!auth.id && userAccount && <Login login={login} loginErr={loginErr} setLoginErr={setLoginErr} />}
      {!auth.id && !userAccount && <Register register={register} regErr={regErr} setRegErr={setRegErr} />}

      {!auth.id && (
        <button onClick={handleClick}>
          {userAccount ? "Register new user" : "Sign in as existing user"}
        </button>
      )}
      {auth.id && (
        <button className="logout-btn" onClick={logout}>
          Logout {auth.username}
        </button>
      )}

      <ul>
        {products.map(product => {
          const isFavorite = favorites.find(favorite => favorite.product_id === product.id);
          return (
            <li key={product.id} className={isFavorite ? 'favorite' : ''}>
              {product.name}
              {auth.id && isFavorite && <button onClick={() => removeFavorite(isFavorite.id)}>-</button>}
              {auth.id && !isFavorite && <button onClick={() => addFavorite(product.id)}>+</button>}
            </li>
          );
        })}
      </ul>
    </>
  );
}


export default App;