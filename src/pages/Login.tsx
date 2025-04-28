import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../components/ui/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        toast({
          title: "Success",
          description: "Check your email for the confirmation link!"
        })
      } else {
        // Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        toast({
          title: "Success",
          description: "Logged in successfully"
        })
        navigate('/')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Development admin login
  const handleDevLogin = async () => {
    setLoading(true)
    try {
      // Use a valid email format
      const validEmail = 'admin@projectmgmt.com'
      const validPassword = 'Password123!'
      
      // Try to sign in first
      const { error } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password: validPassword,
      })
      
      if (error) {
        // If login fails, try to create an account
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: validEmail,
          password: validPassword,
          options: {
            data: {
              role: 'admin'
            }
          }
        })
        
        if (signUpError) {
          throw signUpError
        }
        
        // Manual "fake" login since we don't have email confirmation
        // This creates a session using the data from signup
        const { error: sessionError, data: sessionData } = await supabase.auth.signInWithPassword({
          email: validEmail,
          password: validPassword,
        })
        
        if (sessionError) {
          throw sessionError
        }
      }
      
      toast({
        title: "Success",
        description: "Logged in as Admin"
      })
      navigate('/')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? 'Create Account' : 'Login'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
            </Button>
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp 
                  ? 'Already have an account? Login' 
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                type="button"
                variant="secondary"
                className="w-full" 
                onClick={handleDevLogin}
                disabled={loading}
              >
                Quick Admin Login
              </Button>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                For development purposes only
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 