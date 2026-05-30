import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div><h1>Bezon Customer</h1><p>Welcome to the store!</p></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
