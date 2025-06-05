
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [userCountError, setUserCountError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (authLoading) return;
      if (!authUser || !authUser.uid) {
        setIsCurrentUserAdmin(false);
        setIsLoadingData(false);
        setProfileError("Authentication not found. Please log in.");
        return;
      }

      setProfileError(null);
      setUserCountError(null);
      setFeedbackError(null);

      let adminStatus = false;
      try {
        console.log('[Admin Page] Checking admin status for UID:', authUser.uid);
        const userProfileDocRef = doc(db, 'users', authUser.uid);
        const userProfileSnap = await getDoc(userProfileDocRef);

        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data() as UserProfile;
          if (userProfileData.isAdmin === true) { // Strict boolean check
            adminStatus = true;
            setIsCurrentUserAdmin(true);
            console.log('[Admin Page] User is admin.');
          } else {
            setProfileError(`Your user profile does not have administrator privileges. 'isAdmin' flag is missing, not true (boolean), or profile incorrect. Current isAdmin value: ${userProfileData.isAdmin}`);
            setIsCurrentUserAdmin(false);
            console.log('[Admin Page] User is not admin or isAdmin flag is not boolean true.');
          }
        } else {
          setProfileError(`User profile not found for your account (UID: ${authUser.uid}). Ensure a user document exists in Firestore at 'users/${authUser.uid}' with an 'isAdmin' field set to boolean true.`);
          setIsCurrentUserAdmin(false);
          console.log('[Admin Page] User profile not found.');
        }
      } catch (err: any) {
        console.error("[Admin Page] Error checking admin status (raw error):", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        console.error("[Admin Page] Error checking admin status (err.code):", err.code);
        console.error("[Admin Page] Error checking admin status (err.message):", err.message);
        setProfileError(`Error accessing user profile: ${err.message}. Code: ${err.code}. Please try again or check Firestore permissions.`);
        setIsCurrentUserAdmin(false);
        adminStatus = false;
      }

      if (adminStatus) {
        try {
          console.log('[Admin Page] Fetching feedback submissions.');
          const feedbackQuery = query(collection(db, 'feedbackSubmissions'), orderBy('timestamp', 'desc'));
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const items = feedbackSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: (docSnap.data().timestamp as Timestamp).toDate(),
          })) as FeedbackSubmission[];
          setFeedbackItems(items);
          console.log('[Admin Page] Successfully fetched feedback submissions:', items.length);
        } catch (err: any) {
          console.error("[Admin Page] Error fetching feedback submissions (raw error):", JSON.stringify(err, Object.getOwnPropertyNames(err)));
          console.error("[Admin Page] Error fetching feedback submissions (err.code):", err.code);
          console.error("[Admin Page] Error fetching feedback submissions (err.message):", err.message);
          setFeedbackError(`Failed to load feedback: ${err.message}. Code: ${err.code}.`);
        }
        
        console.log('[Admin Page] Attempting to fetch user count. Current adminStatus:', adminStatus, 'authUser.uid:', authUser?.uid);
        try {
          const usersCollectionRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollectionRef);
          console.log('[Admin Page] Successfully fetched user count snapshot. Size:', usersSnapshot.size);
          setTotalUsers(usersSnapshot.size);
        } catch (err: any) {
          console.error("[Admin Page] Error fetching user count (raw error):", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
          console.error("[Admin Page] Error fetching user count (err.code):", err.code);
          console.error("[Admin Page] Error fetching user count (err.message):", err.message);
          setUserCountError(
            `Failed to load user count: ${err.message} (Code: ${err.code || 'N/A'}). ` +
            `This strongly suggests an issue with Firestore security rules denying the 'list' permission on the '/users' collection path. ` +
            `Please use the Firestore Rules Simulator: simulate a 'get' operation on path 'users' (or 'users/nonexistentdoc') with your admin UID. ` +
            `Ensure your rule 'match /users { allow list: if request.auth != null && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; }' is correctly defined, published, and that the 'isAdmin' field in your user document ('users/${authUser?.uid}') is a boolean 'true' (not a string).`
          );
        }
      }
      setIsLoadingData(false);
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
          <p className="text-muted-foreground max-w-xl">{profileError || "You do not have permission to view this page."}</p>
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
            {userCountError ? (
              <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="inline-block mr-2 h-5 w-5" />
                {userCountError}
              </div>
            ) : totalUsers !== null ? (
              <div>
                <p className="text-4xl font-bold text-foreground">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Registered Users</p>
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
            {feedbackError && (
                <div className="text-destructive mb-4">
                    <AlertTriangle className="inline-block mr-2 h-5 w-5" />
                    {feedbackError}
                </div>
            )}
            {feedbackItems.length === 0 && !feedbackError && !isLoadingData ? (
              <p className="text-muted-foreground text-center py-6">No feedback submissions yet.</p>
            ) : feedbackItems.length > 0 ? (
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
            ) : isLoadingData ? (
               <div className="flex items-center justify-center py-6">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-3 text-muted-foreground">Loading feedback...</p>
               </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
