import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div><h1>Bezon Seller Portal</h1><p>Manage your store.</p></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
