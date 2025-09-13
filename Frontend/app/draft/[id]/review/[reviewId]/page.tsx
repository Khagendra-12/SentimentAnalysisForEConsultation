"use client"

import { ArrowLeft, MessageSquare, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const sentimentColors = {
  positive: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
  negative: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  suggestive: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
};

export default function ReviewDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const draftId = params.id as string;
  const reviewId = params.reviewId as string;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const reviewTitle = searchParams.get('title') || "Review";
  const draftTitle = searchParams.get('draftTitle') || "Draft";
  const [sentiment, setSentiment] = useState("positive");

  useEffect(() => {
    if (reviewId && draftId) {
      // Find the original review in localStorage to get its sentiment and filename
      const reviewsKey = `reviews_${draftId}`;
      const allReviews = JSON.parse(localStorage.getItem(reviewsKey) || "[]");
      const currentReviewInfo = allReviews.find(r => r.id === parseInt(reviewId));
      
      if (currentReviewInfo) {
        setSentiment(currentReviewInfo.sentiment);
        // Construct the filename to request from the backend
        const filename = `${currentReviewInfo.title.replace(/ /g, '_')}.pdf`;
        
        fetch(`http://localhost:5001/api/review/${filename}`)
          .then(res => res.json())
          .then(data => {
            setReview(data);
            setLoading(false);
          })
          .catch(err => {
            console.error("Failed to fetch review details:", err);
            setLoading(false);
          });
      }
    }
  }, [draftId, reviewId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading analysis...</div>;
  }
  if (!review || review.error) {
    return <div className="flex justify-center items-center min-h-screen">Error: Could not load review details.</div>;
  }

  const colors = sentimentColors[sentiment as keyof typeof sentimentColors];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Link href={`/draft/${draftId}/sentiment/${sentiment}?title=${encodeURIComponent(draftTitle)}`}>
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Analysis
            </Button>
          </Link>

          <div className="mb-4">
            <Badge className={colors.badge}>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Sentiment</Badge>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{reviewTitle}</h1>
          <p className="text-gray-600 mb-4">{draftTitle}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Overall Score:</span>
              <span className={`text-lg font-bold ${colors.text}`}>{review.overallScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">{review.comments.length} Comments</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Comments</h2>
          {review.comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className={`${colors.bg} ${colors.border}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Comment #{index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Fine Score:</span>
                      <Badge variant="secondary" className={colors.badge}>{comment.score}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 leading-relaxed">{comment.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}