export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-3xl font-semibold">Welcome to SiifMart Backoffice</h1>
        <p className="text-muted-foreground">Sign in to continue</p>
        <a
          href="/signin"
          className="inline-flex items-center justify-center rounded bg-black text-white px-4 py-2"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}
