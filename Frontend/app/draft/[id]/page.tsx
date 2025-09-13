"use client"
import { ArrowLeft, Upload, TrendingUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { useState, useEffect, useRef } from 'react'

export default function DraftDetailsPage() {
  const params = useParams()
  const draftId = params.id as string
  
  const [draft, setDraft] = useState(null)
  const [sentimentSummary, setSentimentSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [trendData, setTrendData] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (draftId) {
      const savedDrafts = localStorage.getItem("drafts")
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts)
        const currentDraft = drafts.find(d => d.id === parseInt(draftId))
        if (currentDraft) setDraft(currentDraft)
      }

      const summary = localStorage.getItem(`sentimentSummary_${draftId}`)
      setSentimentSummary(summary ? JSON.parse(summary) : {
        positive: { count: 0, percentage: 0 },
        negative: { count: 0, percentage: 0 },
        suggestive: { count: 0, percentage: 0 },
      })

      const reviewsKey = `reviews_${draftId}`
      const savedReviews = localStorage.getItem(reviewsKey)
      if (savedReviews) {
        setReviews(JSON.parse(savedReviews))
      }
    }
  }, [draftId])

  useEffect(() => {
    if (reviews.length > 0) {
      const dailyData = {}
      reviews.forEach(review => {
        const date = new Date(review.date).toLocaleDateString('en-CA')
        if (!dailyData[date]) {
          dailyData[date] = { day: date, positive: 0, negative: 0, suggestive: 0 }
        }
        dailyData[date][review.sentiment] += 1
      })
      const chartData = Object.values(dailyData).sort((a, b) => new Date(a.day) - new Date(b.day));
      setTrendData(chartData)
    }
  }, [reviews])

  const handleUploadClick = () => {
    fileInputRef.current.click()
  }

  // --- MODIFIED FUNCTION FOR MULTIPLE UPLOADS ---
  const handleFileChange = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const formData = new FormData()
    // Append all files to the same form data field
    for (let i = 0; i < files.length; i++) {
        formData.append("files[]", files[i])
    }

    try {
      const response = await fetch("http://localhost:5001/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("File upload failed on the server.")
      
      const results = await response.json() // The backend now returns a list

      // Process all new reviews at once
      const newReviews = results.map(result => ({
        id: Date.now() + Math.random(), // Add random number for uniqueness in batch
        title: result.filename.replace(/_|-/g, ' ').replace('.pdf', ''),
        sentiment: result.category,
        date: new Date().toISOString(),
        score: result.score,
      }))

      const updatedReviews = [...reviews, ...newReviews]
      setReviews(updatedReviews)
      localStorage.setItem(`reviews_${draftId}`, JSON.stringify(updatedReviews))

      // Update the sentiment summary based on all new results
      setSentimentSummary(prev => {
        const newSummary = JSON.parse(JSON.stringify(prev))
        results.forEach(result => {
          newSummary[result.category].count += 1
        })
        
        const total = newSummary.positive.count + newSummary.negative.count + newSummary.suggestive.count
        if (total > 0) {
            newSummary.positive.percentage = Math.round((newSummary.positive.count / total) * 100)
            newSummary.negative.percentage = Math.round((newSummary.negative.count / total) * 100)
            newSummary.suggestive.percentage = Math.round((newSummary.suggestive.count / total) * 100)
        }
        
        localStorage.setItem(`sentimentSummary_${draftId}`, JSON.stringify(newSummary))
        return newSummary
      })

      alert(`${results.length} file(s) uploaded and analyzed successfully!`)

    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Check the console for details.")
    }
  }

  if (!draft || !sentimentSummary) {
    return <div className="text-center p-10">Draft not found or loading...</div>
  }

  const totalReviews = sentimentSummary.positive.count + sentimentSummary.negative.count + sentimentSummary.suggestive.count

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6"
    >
      {/* --- MODIFIED INPUT FOR MULTIPLE FILES --- */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        style={{ display: 'none' }} 
        accept=".pdf"
        multiple // Allow multiple file selection
      />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Drafts
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{draft.title}</h1>
              <p className="text-gray-600">
                {draft.date ? `Created on ${new Date(draft.date).toLocaleDateString()}` : ""}
              </p>
            </div>
            <Button onClick={handleUploadClick} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Review(s)
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="sentiment" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Reviews ({totalReviews})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { type: "positive", data: sentimentSummary.positive, color: "green" },
                { type: "suggestive", data: sentimentSummary.suggestive, color: "orange" },
                { type: "negative", data: sentimentSummary.negative, color: "red" },
              ].map((sentiment) => (
                <Link key={sentiment.type} href={`/draft/${draftId}/sentiment/${sentiment.type}?title=${encodeURIComponent(draft.title)}`}>
                  <Card className={`bg-white border-${sentiment.color}-200 hover:shadow-lg hover:border-${sentiment.color}-400 transition-all duration-200 cursor-pointer group`}>
                    <CardHeader className="pb-3">
                      <CardTitle className={`text-${sentiment.color}-700 group-hover:text-${sentiment.color}-800 flex items-center`}>
                        <div className={`w-3 h-3 bg-${sentiment.color}-500 rounded-full mr-2`}></div>
                        {sentiment.type.charAt(0).toUpperCase() + sentiment.type.slice(1)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold text-${sentiment.color}-700 mb-1`}>{sentiment.data.count}</div>
                      <div className="text-sm text-gray-600">{sentiment.data.percentage}% of total comments</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Sentiment Trends Over Time
                  </CardTitle>
                  <CardDescription>Daily comment volume by sentiment category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" stroke="#666" fontSize={12} />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="positive"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                            name="Positive"
                          />
                          <Line
                            type="monotone"
                            dataKey="negative"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                            name="Negative"
                          />
                          <Line
                            type="monotone"
                            dataKey="suggestive"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                            name="Suggestive"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No trend data available. Upload reviews to see the chart.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="reviews">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Total Reviews Overview
                  </CardTitle>
                  <CardDescription>Complete summary of all reviews and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-700 mb-2">{totalReviews}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-700 mb-2">{sentimentSummary.positive.count}</div>
                      <div className="text-sm text-gray-600">Positive Reviews</div>
                    </div>
                    <div className="text-center p-6 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-700 mb-2">{sentimentSummary.suggestive.count}</div>
                      <div className="text-sm text-gray-600">Suggestive Reviews</div>
                    </div>
                    <div className="text-center p-6 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-700 mb-2">{sentimentSummary.negative.count}</div>
                      <div className="text-sm text-gray-600">Negative Reviews</div>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents ({reviews.length})</h3>
                    {reviews.length > 0 ? (
                        <div className="space-y-2">
                            {reviews.map(review => (
                                <div key={review.id} className="p-2 bg-white rounded shadow-sm text-sm">
                                    {review.title}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No documents have been uploaded for this draft yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
        </Tabs>
      </div>
    </motion.div>
  )
}