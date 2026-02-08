export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          MonkeysWork
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto">
          AI-Powered Freelance Marketplace
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 hover:scale-105"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="px-8 py-3 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 font-medium transition-all duration-200 hover:scale-105"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
