
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
import { Loader2, AlertTriangle, ShieldAlert, ExternalLink, Users } from 'lucide-react';
import Navbar from '@/components/shared/Navbar'; 

export default function AdminFeedbackPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
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
          if (userProfileData.isAdmin === true) { 
            setIsCurrentUserAdmin(true);

            // Fetch feedback submissions
            const feedbackQuery = query(collection(db, 'feedbackSubmissions'), orderBy('timestamp', 'desc'));
            const feedbackSnapshot = await getDocs(feedbackQuery);
            const items = feedbackSnapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data(),
              timestamp: (docSnap.data().timestamp as Timestamp).toDate(),
            })) as FeedbackSubmission[];
            setFeedbackItems(items);

            // Fetch all users to count them
            const usersCollectionRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollectionRef);
            setTotalUsers(usersSnapshot.size);

          } else {
            setIsCurrentUserAdmin(false);
          }
        } else {
          setIsCurrentUserAdmin(false); 
        }
      } catch (err) {
        console.error("Error checking admin status or fetching data:", err);
        setError("Failed to load data. Please try again.");
        setIsCurrentUserAdmin(false);
      } finally {
        setIsLoadingData(false);
      }
    };

    checkAdminAndFetchData();
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Error Loading Data</h1>
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
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center">
              <Users className="mr-3 h-6 w-6 text-primary" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalUsers !== null ? (
              <div>
                <p className="text-4xl font-bold text-foreground">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Registered Users</p>
                <p className="text-xs text-muted-foreground mt-2">Note: This count is based on documents in the 'users' collection. For very large user bases, a more scalable server-side counter is recommended.</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading user count...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Feedback Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No feedback submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 py-3 min-w-[130px] w-[10%]">Date</TableHead>
                      <TableHead className="px-2 py-3 min-w-[150px] w-[15%]">User</TableHead>
                      <TableHead className="px-2 py-3 min-w-[110px] w-[10%]">User Category</TableHead>
                      <TableHead className="px-2 py-3 min-w-[250px] w-[25%]">Feedback</TableHead>
                      <TableHead className="px-2 py-3 min-w-[200px] w-[20%]">AI Summary</TableHead>
                      <TableHead className="px-2 py-3 min-w-[110px] w-[10%]">AI Category</TableHead>
                      <TableHead className="px-2 py-3 min-w-[90px] w-[5%]">Status</TableHead>
                      <TableHead className="px-2 py-3 min-w-[100px] w-[5%]">Route</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-2 py-2 whitespace-nowrap">{format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell className="px-2 py-2 break-all">{item.userId === 'anonymous' ? 'Anonymous' : item.userId}</TableCell>
                        <TableCell className="px-2 py-2">{item.category || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2 whitespace-normal break-words">
                          {item.feedbackText}
                        </TableCell>
                        <TableCell className="px-2 py-2 whitespace-normal break-words">{item.aiAnalysis?.summaryTitle || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2">{item.aiAnalysis?.aiSuggestedCategory || 'N/A'}</TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge variant={getStatusVariant(item.status)} className="capitalize">
                            {item.status || 'New'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2 break-all">
                          {item.route ? (
                            <a href={item.route} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-xs sm:text-sm">
                              {item.route.length > 20 ? item.route.substring(0, 20) + "..." : item.route}
                              <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
                            </a>
                          ) : 'N/A'}
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
