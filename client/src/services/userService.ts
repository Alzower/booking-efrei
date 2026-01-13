const API_URL = "http://localhost:3000/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
}

export const userService = {
  async updateUser(data: UpdateUserData): Promise<User> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erreur lors de la mise à jour du profil"
      );
    }

    return response.json();
  },

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du profil");
    }

    return response.json();
  },

  async getAllUsers(): Promise<User[]> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des utilisateurs");
    }

    return response.json();
  },

  async deleteUser(userId: string): Promise<void> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erreur lors de la suppression de l'utilisateur"
      );
    }
  },
};
