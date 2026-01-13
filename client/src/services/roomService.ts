const API_URL = "http://localhost:3000/api";

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomData {
  name: string;
  capacity: number;
  equipment: string[];
}

export interface UpdateRoomData {
  name?: string;
  capacity?: number;
  equipment?: string[];
}

export const roomService = {
  async getRooms(): Promise<Room[]> {
    const response = await fetch(`${API_URL}/rooms`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des salles");
    }

    return response.json();
  },

  async getRoomById(id: string): Promise<Room> {
    const response = await fetch(`${API_URL}/rooms/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de la salle");
    }

    return response.json();
  },

  async createRoom(data: CreateRoomData): Promise<Room> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de la création de la salle");
    }

    return response.json();
  },

  async updateRoom(id: string, data: UpdateRoomData): Promise<Room> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/rooms/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de la mise à jour de la salle");
    }

    return response.json();
  },

  async deleteRoom(id: string): Promise<void> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/rooms/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de la salle");
    }
  },
};
