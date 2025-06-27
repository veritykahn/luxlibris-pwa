import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/lux_libris_logo.jpg"
              alt="Lux Libris"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em'}}>
              Lux Libris
            </h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-slate-600 hover:text-teal-600 transition-colors">
              Features
            </a>
            <a href="#for-schools" className="text-slate-600 hover:text-teal-600 transition-colors">
              For Schools
            </a>
            <a href="#contact" className="text-slate-600 hover:text-teal-600 transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              Illuminating the World Through
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}Stories
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              The Lux Libris Award curates 20 exceptional books each year—spanning diverse voices, 
              cultures, and experiences from around the globe. Rooted in Catholic faith, we guide 
              readers to engage with the world through the lens of truth, goodness, and beauty.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
              Start Your School&apos;s Journey
            </button>
            <button className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all">
              Watch Demo
            </button>
          </div>

          {/* App Preview */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Student Dashboard Preview */}
              <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl p-6">
                <h3 className="font-bold text-slate-800 mb-4">Student Dashboard</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Reading Progress</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Saint Collection</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Achievements</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Dashboard Preview */}
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl p-6">
                <h3 className="font-bold text-slate-800 mb-4">Admin Dashboard</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Student Progress</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Book Management</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Analytics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 text-lg">📚</span>
                  </div>
                  <span className="text-slate-700">Interactive Reading</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🏆</span>
                  </div>
                  <span className="text-slate-700">Saint Achievements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 text-lg">📊</span>
                  </div>
                  <span className="text-slate-700">Progress Tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">🎯</span>
                  </div>
                  <span className="text-slate-700">Goal Setting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Forming the Whole Child
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built by a Catholic school librarian who understands that stories illuminate minds, 
              hearts, and souls—cultivating empathy, expanding knowledge, and inspiring action.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Gamified Experience</h3>
              <p className="text-slate-600">
                Students collect saints, unlock achievements, and build reading streaks that keep them engaged
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Easy Management</h3>
              <p className="text-slate-600">
                No more paper tracking! Automated progress monitoring and instant reporting for teachers
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✝️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Catholic Values</h3>
              <p className="text-slate-600">
                Integrates faith formation with literacy through saint achievements and Catholic literature
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Image
              src="/images/lux_libris_logo.jpg"
              alt="Lux Libris"
              width={40}
              height={40}
              className="rounded-full"
            />
            <h3 className="text-xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Lux Libris
            </h3>
          </div>
          <p className="text-slate-400 mb-6">
            Transforming reading education, one saint at a time.
          </p>
          <div className="flex justify-center space-x-6">
            <a href="mailto:support@luxlibris.org" className="text-slate-400 hover:text-teal-400 transition-colors">
              support@luxlibris.org
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}