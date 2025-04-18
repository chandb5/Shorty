import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/Card"
import { ThemeToggle } from "./ThemeToggle"
import { useState, FormEvent, ChangeEvent, JSX, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import authService from "../services/auth"

export default function Signup(): JSX.Element {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSignup = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Call the registration API endpoint
      const response = await authService.register({
        email,
        password
      })
      
      console.log("Registration successful:", response.message)
      
      // Redirect to login page after successful registration
      navigate('/login')
    } catch (err: any) {
      console.error("Registration failed:", err)
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-gray-900 dark:to-blue-900 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center pt-8">
          <h2 className="text-2xl font-bold text-center">Create an Account</h2>
          <p className="text-muted-foreground text-center">
            Sign up to start creating and managing short URLs
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="text" 
                placeholder="Username" 
                className="h-11" 
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Email address" 
                className="h-11" 
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Password" 
                className="h-11" 
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Confirm password" 
                className="h-11" 
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-700 text-primary-foreground h-11"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </a>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
