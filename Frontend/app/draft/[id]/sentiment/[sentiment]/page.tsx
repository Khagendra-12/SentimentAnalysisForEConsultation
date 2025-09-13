"use client"

import { ArrowLeft, MessageSquare, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const sentimentColors = {
  positive: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" },
  negative: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  suggestive: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
};

export default function SentimentAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const draftId = params.id as string;
  const sentiment = params.sentiment as string;
  const draftTitle = searchParams.get('title') || "Draft";

  const [reviews, setReviews] = useState([]);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    if (draftId && sentiment) {
      const reviewsKey = `reviews_${draftId}`;
      const allReviews = JSON.parse(localStorage.getItem(reviewsKey) || "[]");
      const filteredReviews = allReviews.filter(review => review.sentiment === sentiment);
      setReviews(filteredReviews);

      if (filteredReviews.length > 0) {
        const filenames = filteredReviews.map(r => `${r.title.replace(/ /g, '_')}.pdf`);
        
        fetch("http://localhost:5001/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filenames, sentiment }),
        })
        .then(res => res.json())
        .then(data => {
            const keywordArray = Object.entries(data).map(([word, details]) => ({
                word,
                frequency: details.count
            }));
            setKeywords(keywordArray);
        })
        .catch(error => console.error("Failed to fetch keywords:", error));
      } else {
        setKeywords([]);
      }
    }
  }, [draftId, sentiment]);

  const colors = sentimentColors[sentiment as keyof typeof sentimentColors] || sentimentColors.positive;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Link href={`/draft/${draftId}`}>
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Draft Details
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 ${colors.dot} rounded-full`}></div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{sentiment} Sentiment Analysis</h1>
          </div>
          <p className="text-gray-600">{draftTitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className={`${colors.bg} ${colors.border} mb-8`}>
            <CardHeader>
              <CardTitle className={`${colors.text} flex items-center`}>
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Keywords
              </CardTitle>
              <CardDescription>Most frequently mentioned words in {sentiment} feedback</CardDescription>
            </CardHeader>
            <CardContent>
                {keywords.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {keywords.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.05 * index }}
                            className="text-center"
                        >
                            <div
                            className={`${colors.text} font-semibold mb-1`}
                            style={{ fontSize: `${Math.max(14, item.frequency * 2)}px` }}
                            >
                            {item.word}
                            </div>
                            <div className="text-sm text-gray-600">{item.frequency} mentions</div>
                        </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No keywords to display. Upload more documents to generate keywords.
                    </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Reviews ({reviews.length})
              </CardTitle>
              <CardDescription>Individual reviews categorized as {sentiment} sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Link href={`/draft/${draftId}/review/${review.id}?title=${encodeURIComponent(review.title)}&draftTitle=${encodeURIComponent(draftTitle)}`}>
                        <Card className="bg-gray-50 border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group">
                          <CardContent className="p-4 flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{review.title}</h3>
                            <div className="ml-4 text-right">
                              <div className="text-sm text-gray-500 mb-1">Fine Score</div>
                              <div className={`text-lg font-bold ${colors.text}`}>{review.score}</div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reviews have been uploaded for this category yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}