import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div><h1>Bezon Admin</h1><p>Control panel.</p></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
