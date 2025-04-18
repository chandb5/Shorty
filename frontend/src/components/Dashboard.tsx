import { useState, useEffect } from "react"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Card, CardContent, CardHeader } from "./ui/Card"
import { ThemeToggle } from "./ThemeToggle"
import { useNavigate } from "react-router-dom"
import authService from "../services/auth"
import urlService from "../services/url"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/AlertDialog"

// Interface for our component's state
interface DisplayUrlData {
  id: string
  shortUrl: string
  originalUrl: string
  slug: string
  createdAt: string
  clicks: number
}

// Interface for our component's state
interface UrlData {
  id: string
  shortUrl: string
  originalUrl: string
  createdAt: string
  clicks: number
}

export default function Dashboard() {
  const [longUrl, setLongUrl] = useState<string>("")
  const [urls, setUrls] = useState<DisplayUrlData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [shortenLoading, setShortenLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [shortUrlResult, setShortUrlResult] = useState<{shortUrl: string, originalUrl: string} | null>(null)
  const [editingUrl, setEditingUrl] = useState<string | null>(null)
  const [updatedLongUrl, setUpdatedLongUrl] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  
  // Check if user is logged in
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
    } else {
      // Load user's URLs
      loadUserUrls()
    }
  }, [navigate])
  
  const loadUserUrls = async () => {
    setLoading(true)
    try {
      const response = await urlService.getUserUrls()
      
      // Transform API response to component's expected format
      const formattedUrls = response.short_urls.map(url => ({
        id: url.id,
        shortUrl: urlService.formatShortUrl(url.slug),
        originalUrl: url.url,
        slug: url.slug,
        createdAt: new Date().toISOString(), // API doesn't provide creation date yet
        clicks: 0 // API doesn't provide click count yet
      }))
      
      setUrls(formattedUrls)
    } catch (err: any) {
      console.error("Failed to load URLs:", err)
      setError("Failed to load your shortened URLs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleShortenUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl.trim()) {
      setError("Please enter a URL to shorten")
      return
    }
    
    setShortenLoading(true)
    setError(null)
    
    try {
      const response = await urlService.shortenUrl({ url: longUrl })
      const shortUrl = urlService.formatShortUrl(response.data.slug)
      
      setShortUrlResult({
        shortUrl: shortUrl,
        originalUrl: response.data.url
      })
      
      // Refresh the URL list
      await loadUserUrls()
      
      setLongUrl("") // Clear the input field
    } catch (err: any) {
      console.error("Failed to shorten URL:", err)
      setError(err.response?.data?.message || "Failed to shorten URL. Please try again.")
    } finally {
      setShortenLoading(false)
    }
  }

  const handleCopyShortUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        // You could add a toast notification here in the future
        console.log("URL copied to clipboard")
      })
      .catch(err => {
        console.error("Failed to copy URL:", err)
      })
  }

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Truncate long URLs for display
  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength 
      ? `${url.substring(0, maxLength)}...` 
      : url
  }

  // Start edit for a specific URL
  const handleStartEdit = (url: DisplayUrlData) => {
    setEditingUrl(url.slug)
    setUpdatedLongUrl(url.originalUrl)
    setIsEditing(true)
    setError(null)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUrl(null)
    setUpdatedLongUrl("")
    setIsEditing(false)
  }

  // Save edited URL
  const handleSaveEdit = async () => {
    if (!editingUrl || !updatedLongUrl.trim()) {
      setError("Please enter a valid URL")
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      await urlService.updateUrl({
        slug: editingUrl,
        updated_url: updatedLongUrl
      })

      // Refresh the URL list
      await loadUserUrls()
      
      // Reset edit state
      setEditingUrl(null)
      setUpdatedLongUrl("")
      setIsEditing(false)
    } catch (err: any) {
      console.error("Failed to update URL:", err)
      setError(err.response?.data?.message || "Failed to update URL. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  // Delete a URL
  const handleDeleteUrl = async (slug: string) => {
    setActionLoading(true)
    setError(null)

    try {
      await urlService.deleteUrl(slug)
      
      // Refresh the URL list
      await loadUserUrls()
    } catch (err: any) {
      console.error("Failed to delete URL:", err)
      setError(err.response?.data?.message || "Failed to delete URL. Please try again.")
    } finally {
      setActionLoading(false)
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-gray-900 dark:to-blue-900 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
        <h1 className="text-xl font-bold">Shorty URL Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={() => {
              authService.logout()
              navigate('/login')
            }}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* URL Shortener Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold">Shorten a URL</h2>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {shortUrlResult && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline font-semibold mb-1">URL shortened successfully!</span>
                <div className="flex justify-between items-center">
                  <p className="text-sm break-all">{shortUrlResult.shortUrl}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyShortUrl(shortUrlResult.shortUrl)}
                    className="ml-2"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleShortenUrl} className="space-y-4">
              <div className="flex space-x-2">
                <Input 
                  type="url" 
                  placeholder="Enter a long URL to shorten" 
                  className="flex-grow h-11" 
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  disabled={shortenLoading}
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-blue-700 text-primary-foreground h-11"
                  disabled={shortenLoading}
                >
                  {shortenLoading ? "Shortening..." : "Shorten URL"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* URLs Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold">Your Shortened URLs</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading your URLs...</div>
            ) : urls.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                You haven't shortened any URLs yet. Try shortening one above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left">Short URL</th>
                      <th className="px-4 py-2 text-left">Original URL</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((url) => (
                      <tr key={url.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3">
                          <a 
                            href={url.shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {url.shortUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {editingUrl === url.slug ? (
                            <Input 
                              type="url" 
                              value={updatedLongUrl}
                              onChange={(e) => setUpdatedLongUrl(e.target.value)}
                              disabled={actionLoading}
                              className="w-full"
                              required
                            />
                          ) : (
                            <span title={url.originalUrl} className="cursor-help">
                              {truncateUrl(url.originalUrl)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            {editingUrl === url.slug ? (
                              <>
                                <Button 
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? "Saving..." : "Save"}
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={actionLoading}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyShortUrl(url.shortUrl)}
                                >
                                  Copy
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartEdit(url)}
                                >
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive"
                                      size="sm"
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this shortened URL? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUrl(url.slug)}
                                        disabled={actionLoading}
                                      >
                                        {actionLoading ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
