const API_URL = "http://localhost:3000/api";

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationData {
  roomId: string;
  startTime: string;
  endTime: string;
}

export const reservationService = {
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erreur lors de la création de la réservation"
      );
    }

    return response.json();
  },

  async getUserReservations(): Promise<Reservation[]> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/reservation`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des réservations");
    }

    return response.json();
  },

  async deleteReservation(reservationId: string): Promise<void> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/reservation/${reservationId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de la réservation");
    }
  },

  async getAllReservations(): Promise<Reservation[]> {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${API_URL}/reservation/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des réservations");
    }

    return response.json();
  },
};
