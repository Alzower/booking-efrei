function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">EasyBooking</h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
              Fonctionnalités
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              À propos
            </a>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              Se connecter
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
