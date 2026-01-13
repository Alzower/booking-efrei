import { useState } from "react";
import Header from "../components/Header";

interface Reservation {
  id: string;
  roomName: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: "upcoming" | "past" | "cancelled" | "ongoing";
}

function HistoryPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">(
    "all"
  );

  const mockReservations: Reservation[] = [
    {
      id: "1",
      roomName: "Salle de réunion A",
      location: "Bâtiment Principal, 2ème étage",
      startDate: "2024-01-20T09:00:00",
      endDate: "2024-01-20T11:00:00",
      capacity: 10,
      status: "upcoming",
    },
    {
      id: "2",
      roomName: "Salle de conférence",
      location: "Bâtiment B, Rez-de-chaussée",
      startDate: "2024-01-15T14:00:00",
      endDate: "2024-01-15T16:00:00",
      capacity: 50,
      status: "past",
    },
    {
      id: "3",
      roomName: "Salle de formation",
      location: "Bâtiment A, 1er étage",
      startDate: "2024-01-18T10:00:00",
      endDate: "2024-01-18T12:00:00",
      capacity: 20,
      status: "cancelled",
    },
  ];

  const filteredReservations = mockReservations.filter((res) => {
    if (filter === "all") return true;
    return res.status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cancelled":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Annulée
          </span>
        );
      case "past":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Terminée
          </span>
        );
      case "upcoming":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            À venir
          </span>
        );
      case "ongoing":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            En cours
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historique des réservations
          </h1>
          <p className="text-gray-600">
            Consultez et gérez vos réservations passées et à venir
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Toutes ({mockReservations.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "past"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Passées
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "cancelled"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Annulées
          </button>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune réservation
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "Vous n'avez pas encore de réservation."
                : `Vous n'avez aucune réservation ${
                    filter === "upcoming"
                      ? "à venir"
                      : filter === "past"
                      ? "passée"
                      : "annulée"
                  }.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {reservation.roomName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {reservation.location}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(reservation.startDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(reservation.startDate)} -{" "}
                          {formatTime(reservation.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Capacité: {reservation.capacity} personnes
                      </p>
                    </div>
                  </div>

                  {reservation.status === "upcoming" && (
                    <button className="mt-6 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">
                      Annuler la réservation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
