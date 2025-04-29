import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import MainPage from './pages/main';

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<MainPage />}>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
