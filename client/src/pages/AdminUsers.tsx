import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { userService } from "../services/userService";
import type { User } from "../services/userService";
import { authService } from "../services/authService";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, currentUserData] = await Promise.all([
        userService.getAllUsers(),
        userService.getCurrentUser(),
      ]);
      setUsers(usersData);
      setCurrentUser(currentUserData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des utilisateurs"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (currentUser && userId === currentUser.id) {
      setError("Vous ne pouvez pas supprimer votre propre compte");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await userService.deleteUser(userId);
      setSuccess("Utilisateur supprimé avec succès!");
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          Admin
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        Utilisateur
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-xl text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration - Gestion des utilisateurs
          </h1>
          <p className="text-gray-600">
            Consultez et gérez tous les utilisateurs de l'application
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Utilisateur
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rôle
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0) || "?"}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {currentUser && user.id === currentUser.id ? (
                        <span className="text-gray-400 italic">Vous</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          data-testid={`delete-user-${user.id}`}
                          className="text-red-600 hover:text-red-900 font-medium transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun utilisateur
              </h3>
              <p className="text-gray-600">
                Aucun utilisateur n'est enregistré dans le système
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Info:</span> Vous ne pouvez pas
                supprimer votre propre compte. La suppression d'un utilisateur
                est irréversible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
