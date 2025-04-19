import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import urlService from "../services/url";
import { Chart } from "./ui/Chart";
import { ThemeToggle } from "./ThemeToggle";
import authService from "../services/auth";

interface URLStatsData {
  id: string;
  shortUrl: string;
  originalUrl: string;
  slug: string;
  clicks: number;
  visits?: {
    id: string;
    shortened_url_id: string;
    visit_time: string;
  }[];
}

export default function StatsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [urlData, setUrlData] = useState<URLStatsData | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!slug) {
      navigate('/');
      return;
    }

    loadUrlStats(slug);
  }, [slug, navigate]);

  const loadUrlStats = async (urlSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      // First get the basic URL data
      const urlsResponse = await urlService.getUserUrls();
      const urlInfo = urlsResponse.short_urls.find(url => url.slug === urlSlug);

      if (!urlInfo) {
        setError("URL not found");
        setLoading(false);
        return;
      }

      // Then get the detailed visit stats
      const visitsResponse = await urlService.getUrlVisits(urlSlug);

      setUrlData({
        id: urlInfo.id,
        shortUrl: urlService.formatShortUrl(urlInfo.slug),
        originalUrl: urlInfo.url,
        slug: urlInfo.slug,
        clicks: visitsResponse.visits.length,
        visits: visitsResponse.visits
      });
    } catch (err: any) {
      console.error("Failed to load URL statistics:", err);
      setError(err.response?.data?.message || "Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time-based visit distribution
  const getVisitStats = (visits: { visit_time: string }[] = []) => {
    if (!visits || visits.length === 0) return null;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const todayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time);
      return visitDate.toDateString() === today.toDateString();
    }).length;

    const yesterdayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time);
      return visitDate.toDateString() === yesterday.toDateString();
    }).length;

    const lastWeekVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time);
      return visitDate >= lastWeek;
    }).length;

    const lastMonthVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_time);
      return visitDate >= lastMonth;
    }).length;

    return {
      today: todayVisits,
      yesterday: yesterdayVisits,
      lastWeek: lastWeekVisits,
      lastMonth: lastMonthVisits,
      total: visits.length
    };
  };

  // Process visit data for daily chart
  const prepareDailyChartData = (visits: { visit_time: string }[] = []) => {
    if (!visits || visits.length === 0) return [];

    // Create a map to count visits by day
    const visitsByDay = new Map<string, number>();

    // Get date range: last 14 days
    const today = new Date();
    let dateArray = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      visitsByDay.set(dateStr, 0);
      dateArray.push({
        date: dateStr,
        visits: 0,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    // Count visits for each day
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_time);
      const dateStr = visitDate.toISOString().split('T')[0];

      if (visitsByDay.has(dateStr)) {
        visitsByDay.set(dateStr, (visitsByDay.get(dateStr) || 0) + 1);
      }
    });

    // Update the dateArray with actual visit counts
    dateArray.forEach(item => {
      item.visits = visitsByDay.get(item.date) || 0;
    });

    return dateArray;
  };

  // Process visit data for monthly chart
  const prepareMonthlyChartData = (visits: { visit_time: string }[] = []) => {
    if (!visits || visits.length === 0) return [];

    // Create a map to count visits by month
    const visitsByMonth = new Map<string, number>();

    // Get date range: last 6 months
    const today = new Date();
    let monthArray = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      visitsByMonth.set(monthKey, 0);
      monthArray.push({
        month: monthKey,
        visits: 0,
        displayMonth: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }

    // Count visits for each month
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_time);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;

      if (visitsByMonth.has(monthKey)) {
        visitsByMonth.set(monthKey, (visitsByMonth.get(monthKey) || 0) + 1);
      }
    });

    // Update the monthArray with actual visit counts
    monthArray.forEach(item => {
      item.visits = visitsByMonth.get(item.month) || 0;
    });

    return monthArray;
  };

  const handleCopyShortUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        console.log("URL copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy URL:", err);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-gray-900 dark:to-blue-900 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Dashboard</span>
          </Button>
          <h1 className="text-xl font-bold hidden md:block">URL Statistics</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={() => {
              authService.logout();
              navigate('/login');
            }}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <div className="mt-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : urlData ? (
          <>
            {/* URL Info Card */}
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <h2 className="text-2xl font-bold">URL Information</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Short URL</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-lg font-medium break-all">{urlData.shortUrl}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyShortUrl(urlData.shortUrl)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Original URL</h3>
                    <p className="mt-1 text-md break-all">
                      <a 
                        href={urlData.originalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {urlData.originalUrl}
                      </a>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clicks</h3>
                    <p className="mt-1 text-3xl font-bold">{urlData.clicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Summary Statistics */}
            {urlData.visits && urlData.visits.length > 0 && getVisitStats(urlData.visits) && (
              <Card className="mb-8 shadow-lg">
                <CardHeader>
                  <h2 className="text-2xl font-bold">Visit Summary</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Today</div>
                      <div className="text-3xl font-bold">{getVisitStats(urlData.visits)?.today || 0}</div>
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Yesterday</div>
                      <div className="text-3xl font-bold">{getVisitStats(urlData.visits)?.yesterday || 0}</div>
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last 7 Days</div>
                      <div className="text-3xl font-bold">{getVisitStats(urlData.visits)?.lastWeek || 0}</div>
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last 30 Days</div>
                      <div className="text-3xl font-bold">{getVisitStats(urlData.visits)?.lastMonth || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Visit Charts */}
            {urlData.visits && urlData.visits.length > 0 && (
              <>
                {/* Daily Visits Chart */}
                <Card className="mb-8 shadow-lg">
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Daily Visits (Last 14 Days)</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Chart 
                        data={prepareDailyChartData(urlData.visits)}
                        xAxisDataKey="displayDate"
                        bars={[
                          {
                            dataKey: "visits",
                            name: "Visits",
                            color: "#3B82F6"
                          }
                        ]}
                        height={350}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Visits Chart */}
                <Card className="mb-8 shadow-lg">
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Monthly Visits (Last 6 Months)</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Chart 
                        data={prepareMonthlyChartData(urlData.visits)}
                        xAxisDataKey="displayMonth"
                        bars={[
                          {
                            dataKey: "visits",
                            name: "Visits",
                            color: "#8B5CF6"
                          }
                        ]}
                        height={350}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {/* Visit History */}
            {urlData.visits && urlData.visits.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <h2 className="text-2xl font-bold">Visit History</h2>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="px-4 py-3 text-left">Visit ID</th>
                          <th className="px-4 py-3 text-left">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...urlData.visits]
                          .sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime())
                          .map((visit) => (
                          <tr key={visit.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-3 text-sm font-mono">{visit.id}</td>
                            <td className="px-4 py-3">{formatDateTime(visit.visit_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No visit data available for this URL yet.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
