import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Transactions } from './views/Transactions';
import { Import } from './views/Import';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Transactions />} />
          <Route path="import" element={<Import />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
