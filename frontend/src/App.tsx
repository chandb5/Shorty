import { ThemeProvider } from "./components/ThemeProvider"
import Login from "./components/Login"
import Signup from "./components/Signup"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import "./index.css"
import { JSX } from "react"
import Dashboard from "./components/Dashboard"

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={false}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
