import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Transactions } from './views/Transactions';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Transactions />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
