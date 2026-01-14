import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { userService } from "../services/userService";

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    setIsAuthenticated(!!token);

    if (token) {
      loadUserRole();
    }
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await userService.getCurrentUser();
      setUserRole(user.role);
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle:", err);
    }
  };

  const handleLogout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
    setShowMenu(false);
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/dashboard" : "/"}>
              <h1 className="text-2xl font-bold text-blue-600">EasyBooking</h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated && (
              <>
                <a
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Fonctionnalités
                </a>
                <a
                  href="#about"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  À propos
                </a>
              </>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  data-testid="menue-button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile/edit"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Modifier le profil
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Historique
                    </Link>
                    {userRole === "ADMIN" && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Administration
                        </div>
                        <Link
                          to="/admin"
                          onClick={() => setShowMenu(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Gestion des salles
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setShowMenu(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Gestion des utilisateurs
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  Se connecter
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
