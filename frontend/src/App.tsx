import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Transactions } from './views/Transactions';
import { Import } from './views/Import';
import { Categories } from './views/Categories';
import { Installments } from './views/Installments';
import { Investments } from './views/Investments';
import { IgnoredTransactions } from './views/IgnoredTransactions';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Transactions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="import" element={<Import />} />
          <Route path="installments" element={<Installments />} />
          <Route path="investments" element={<Investments />} />
          <Route path="ignored" element={<IgnoredTransactions />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
