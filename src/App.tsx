import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ComposerPage } from './pages/ComposerPage'
import { LibraryPage } from './pages/LibraryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/song/:id" element={<ComposerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
