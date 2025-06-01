import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Welcome to FODMAPSafe
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with Google to continue.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col items-center">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
