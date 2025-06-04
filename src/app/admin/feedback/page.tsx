
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { FeedbackSubmission, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, ShieldAlert, ExternalLink } from 'lucide-react';
import Navbar from '@/components/shared/Navbar'; // Import Navbar

export default function AdminFeedbackPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminAndFetchFeedback = async () => {
      if (authLoading) return;
      if (!authUser) {
        setIsCurrentUserAdmin(false);
        setIsLoadingData(false);
        return;
      }

      try {
        const userProfileDocRef = doc(db, 'users', authUser.uid);
        const userProfileSnap = await getDoc(userProfileDocRef);

        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data() as UserProfile;
          if (userProfileData.isAdmin === true) { // Simplified admin check
            setIsCurrentUserAdmin(true);
            const feedbackQuery = query(collection(db, 'feedbackSubmissions'), orderBy('timestamp', 'desc'));
            const feedbackSnapshot = await getDocs(feedbackQuery);
            const items = feedbackSnapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data(),
              timestamp: (docSnap.data().timestamp as Timestamp).toDate(),
            })) as FeedbackSubmission[];
            setFeedbackItems(items);
          } else {
            setIsCurrentUserAdmin(false);
          }
        } else {
          setIsCurrentUserAdmin(false); // Profile doesn't exist
        }
      } catch (err) {
        console.error("Error checking admin status or fetching feedback:", err);
        setError("Failed to load data. Please try again.");
        setIsCurrentUserAdmin(false);
      } finally {
        setIsLoadingData(false);
      }
    };

    checkAdminAndFetchFeedback();
  }, [authUser, authLoading]);

  if (isLoadingData || authLoading || isCurrentUserAdmin === null) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-lg text-foreground">Loading Admin Dashboard...</p>
        </div>
      </>
    );
  }

  if (!isCurrentUserAdmin) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-6">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-6">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Error Loading Feedback</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </>
    );
  }
  
  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'new': return 'default'; 
      case 'viewed': return 'secondary';
      case 'in-progress': return 'outline'; 
      case 'planned': return 'outline'; 
      case 'completed': return 'default'; 
      case 'dismissed': return 'destructive';
      default: return 'secondary';
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Admin Feedback Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No feedback submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] px-2 py-3">Date</TableHead>
                      <TableHead className="w-[180px] px-2 py-3">User</TableHead>
                      <TableHead className="w-[120px] px-2 py-3">User Category</TableHead>
                      <TableHead className="min-w-[200px] max-w-sm px-2 py-3">Feedback</TableHead>
                      <TableHead className="min-w-[150px] max-w-xs px-2 py-3">AI Summary</TableHead>
                      <TableHead className="w-[130px] px-2 py-3">AI Category</TableHead>
                      <TableHead className="w-[100px] px-2 py-3">Status</TableHead>
                       <TableHead className="w-[120px] px-2 py-3">Route</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-2 py-2">{format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell className="px-2 py-2 break-all">{item.userId === 'anonymous' ? 'Anonymous' : item.userId}</TableCell>
                        <TableCell className="px-2 py-2">{item.category || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2 whitespace-pre-wrap break-words">
                          {item.feedbackText}
                        </TableCell>
                        <TableCell className="px-2 py-2 whitespace-pre-wrap break-words">{item.aiAnalysis?.summaryTitle || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2">{item.aiAnalysis?.aiSuggestedCategory || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge variant={getStatusVariant(item.status)} className="capitalize">
                            {item.status || 'New'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2 break-all">
                          <a href={item.route} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                            {item.route || 'N/A'} <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
