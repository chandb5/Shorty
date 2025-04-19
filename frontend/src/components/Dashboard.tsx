import { useState, useEffect } from "react"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Card, CardContent, CardHeader } from "./ui/Card"
import { ThemeToggle } from "./ThemeToggle"
import { useNavigate } from "react-router-dom"
import authService from "../services/auth"
import urlService from "../services/url"
import { Chart } from "./ui/Chart"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/AlertDialog"

// Interface for our component's state
interface DisplayUrlData {
  id: string
  shortUrl: string
  originalUrl: string
  slug: string
  createdAt: string
  clicks: number
  visits?: {
    id: string;
    shortened_url_id: string;
    visit_time: string;
  }[]
  lastVisit?: string
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
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [selectedUrl, setSelectedUrl] = useState<DisplayUrlData | null>(null)
  const [showStats, setShowStats] = useState<boolean>(false)
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
      const formattedUrls = response.short_urls.map(url => ({
        id: url.id,
        shortUrl: urlService.formatShortUrl(url.slug),
        originalUrl: url.url,
        slug: url.slug,
        createdAt: new Date().toISOString(),
        clicks: 0
      }))

      // Get visit data for all URLs
      try {
        const visitsResponse = await urlService.getAllVisits()
        
        // Group visits by shortened_url_id
        const visitsByUrlId = visitsResponse.visits.reduce((acc, visit) => {
          if (!acc[visit.shortened_url_id]) {
            acc[visit.shortened_url_id] = []
          }
          acc[visit.shortened_url_id].push(visit)
          return acc
        }, {} as Record<string, typeof visitsResponse.visits>)
        
        // Update formattedUrls with visit counts and last visit time
        const updatedUrls = formattedUrls.map(url => {
          const urlVisits = visitsByUrlId[url.id] || []
          return {
            ...url,
            clicks: urlVisits.length,
            visits: urlVisits,
            lastVisit: urlVisits.length > 0 
              ? urlVisits.sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime())[0].visit_time
              : undefined
          }
        })
        
        setUrls(updatedUrls)
      } catch (err) {
        console.error("Failed to load visit data:", err)
        // Still set URLs even if visit data failed to load
        setUrls(formattedUrls)
      }
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
  
  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Get time-based visit distribution
  const getVisitStats = (visits: {visit_time: string}[] = []) => {
    if (!visits || visits.length === 0) return null
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const todayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time)
      return visitDate.toDateString() === today.toDateString()
    }).length
    
    const yesterdayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time)
      return visitDate.toDateString() === yesterday.toDateString()
    }).length
    
    const lastWeekVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time)
      return visitDate >= lastWeek
    }).length
    
    const lastMonthVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time)
      return visitDate >= lastMonth
    }).length
    
    return {
      today: todayVisits,
      yesterday: yesterdayVisits,
      lastWeek: lastWeekVisits,
      lastMonth: lastMonthVisits,
      total: visits.length
    }
  }

  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength 
      ? `${url.substring(0, maxLength)}...` 
      : url
  }

  const handleStartEdit = (url: DisplayUrlData) => {
    setEditingUrl(url.slug)
    setUpdatedLongUrl(url.originalUrl)
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingUrl(null)
    setUpdatedLongUrl("")
    setIsEditing(false)
  }

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

  const handleDeleteUrl = async (slug: string) => {
    setActionLoading(true)
    setError(null)

    try {
      await urlService.deleteUrl(slug)

      await loadUserUrls()
    } catch (err: any) {
      console.error("Failed to delete URL:", err)
      setError(err.response?.data?.message || "Failed to delete URL. Please try again.")
    } finally {
      setActionLoading(false)
      setIsDeleting(false)
    }
  }

  const prepareDailyChartData = (visits: {visit_time: string}[] = []) => {
    if (!visits || visits.length === 0) return []
    
    const visitsByDay = new Map<string, number>()
    const today = new Date()
    let dateArray = []
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      visitsByDay.set(dateStr, 0)
      dateArray.push({
        date: dateStr,
        visits: 0,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_time)
      const dateStr = visitDate.toISOString().split('T')[0]
      
      if (visitsByDay.has(dateStr)) {
        visitsByDay.set(dateStr, (visitsByDay.get(dateStr) || 0) + 1)
      }
    })
    
    dateArray.forEach(item => {
      item.visits = visitsByDay.get(item.date) || 0
    })
    
    return dateArray
  }
  
  const prepareMonthlyChartData = (visits: {visit_time: string}[] = []) => {
    if (!visits || visits.length === 0) return []
    
    const visitsByMonth = new Map<string, number>()
    
    const today = new Date()
    let monthArray = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      visitsByMonth.set(monthKey, 0)
      monthArray.push({
        month: monthKey,
        visits: 0,
        displayMonth: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_time)
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`
      
      if (visitsByMonth.has(monthKey)) {
        visitsByMonth.set(monthKey, (visitsByMonth.get(monthKey) || 0) + 1)
      }
    })
    
    monthArray.forEach(item => {
      item.visits = visitsByMonth.get(item.month) || 0
    })
    
    return monthArray
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
                      <th className="px-4 py-2 text-center">Clicks</th>
                      <th className="px-4 py-2 text-center">Last Visit</th>
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
                            {url.slug}
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
                          {url.clicks}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {url.lastVisit ? formatDateTime(url.lastVisit) : 'No visits yet'}
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
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/stats/${url.slug}`)}
                                >
                                  Stats
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

        {/* Statistics Modal */}
        {selectedUrl && (
          <AlertDialog open={showStats} onOpenChange={setShowStats}>
            <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <AlertDialogHeader>
                <AlertDialogTitle>URL Statistics</AlertDialogTitle>
                <AlertDialogDescription>
                  Detailed statistics for: <span className="font-medium">{selectedUrl.shortUrl}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="py-4 overflow-y-auto flex-grow">
                {statsLoading ? (
                  <div className="text-center py-8">Loading statistics...</div>
                ) : (
                  <>
                    {/* Summary Statistics */}
                    <Card className="mb-6">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Summary</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</div>
                            <div className="text-2xl font-bold">{selectedUrl.clicks || 0}</div>
                          </div>
                          
                          {selectedUrl.visits && selectedUrl.visits.length > 0 && getVisitStats(selectedUrl.visits) && (
                            <>
                              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Today</div>
                                <div className="text-2xl font-bold">{getVisitStats(selectedUrl.visits)?.today || 0}</div>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Last 7 Days</div>
                                <div className="text-2xl font-bold">{getVisitStats(selectedUrl.visits)?.lastWeek || 0}</div>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Last 30 Days</div>
                                <div className="text-2xl font-bold">{getVisitStats(selectedUrl.visits)?.lastMonth || 0}</div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Original URL: <a href={selectedUrl.originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedUrl.originalUrl}</a>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Visit Charts */}
                    {selectedUrl.visits && selectedUrl.visits.length > 0 && (
                      <>
                        {/* Daily Visits Chart */}
                        <Card className="mb-6">
                          <CardHeader>
                            <h3 className="text-lg font-semibold">Daily Visits (Last 14 Days)</h3>
                          </CardHeader>
                          <CardContent>
                            <Chart 
                              data={prepareDailyChartData(selectedUrl.visits)}
                              xAxisDataKey="displayDate"
                              bars={[
                                {
                                  dataKey: "visits",
                                  name: "Visits",
                                  color: "#3B82F6"
                                }
                              ]}
                              height={250}
                            />
                          </CardContent>
                        </Card>

                        {/* Monthly Visits Chart */}
                        <Card className="mb-6">
                          <CardHeader>
                            <h3 className="text-lg font-semibold">Monthly Visits (Last 6 Months)</h3>
                          </CardHeader>
                          <CardContent>
                            <Chart 
                              data={prepareMonthlyChartData(selectedUrl.visits)}
                              xAxisDataKey="displayMonth"
                              bars={[
                                {
                                  dataKey: "visits",
                                  name: "Visits",
                                  color: "#8B5CF6"
                                }
                              ]}
                              height={250}
                            />
                          </CardContent>
                        </Card>
                      </>
                    )}
                    
                    {/* Visit History */}
                    {selectedUrl.visits && selectedUrl.visits.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold">Visit History</h3>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                  <th className="px-4 py-2 text-left">Visit ID</th>
                                  <th className="px-4 py-2 text-left">Date & Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...selectedUrl.visits]
                                  .sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime())
                                  .map((visit) => (
                                  <tr key={visit.id} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-2 text-sm font-mono">{visit.id.substring(0, 8)}...</td>
                                    <td className="px-4 py-2">{formatDateTime(visit.visit_time)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No visit data available for this URL yet.
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
