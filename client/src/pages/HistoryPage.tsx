import { useState, useEffect } from "react";
import Header from "../components/Header";
import { reservationService } from "../services/reservationService";
import { roomService } from "../services/roomService";
import type { Reservation } from "../services/reservationService";
import type { Room } from "../services/roomService";

type ReservationStatus = "upcoming" | "past" | "ongoing" | "cancelled";

interface ReservationWithStatus extends Reservation {
  status: ReservationStatus;
}

function HistoryPage() {
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "cancelled" | "past"
  >("all");
  const [reservations, setReservations] = useState<ReservationWithStatus[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservationsData, roomsData] = await Promise.all([
        reservationService.getUserReservations(),
        roomService.getRooms(),
      ]);

      const now = new Date();
      const reservationsWithStatus: ReservationWithStatus[] =
        reservationsData.map((reservation) => {
          const start = new Date(reservation.startTime);
          const end = new Date(reservation.endTime);

          let status: ReservationStatus;
          if (now < start) {
            status = "upcoming";
          } else if (now >= start && now <= end) {
            status = "ongoing";
          } else {
            status = "past";
          }

          return { ...reservation, status };
        });

      setReservations(reservationsWithStatus);
      setRooms(roomsData);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Impossible de charger les réservations");
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (filter === "all") return true;
    return res.status === filter;
  });

  const getRoomById = (roomId: string) => {
    return rooms.find((r) => r.id === roomId);
  };

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

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
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
      case "cancelled":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Annulée
          </span>
        );
      default:
        return null;
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await reservationService.deleteReservation(reservationId);
      await loadData();
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err);
      setError("Impossible d'annuler la réservation");
    }
  };

  const getCountByStatus = (
    status: "all" | "upcoming" | "past" | "cancelled"
  ) => {
    if (status === "all") return reservations.length;
    return reservations.filter((r) => r.status === status).length;
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
            Historique des réservations
          </h1>
          <p className="text-gray-600">
            Consultez et gérez vos réservations passées et à venir
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Toutes ({getCountByStatus("all")})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            À venir ({getCountByStatus("upcoming")})
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "past"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Passées ({getCountByStatus("past")})
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "cancelled"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Annulées ({getCountByStatus("cancelled")})
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
            {filteredReservations.map((reservation) => {
              const room = getRoomById(reservation.roomId);
              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {room ? room.name : "Salle inconnue"}
                        </h3>
                        {room && room.equipment.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.equipment.slice(0, 3).map((eq, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
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
                            {formatDate(reservation.startTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(reservation.startTime)} -{" "}
                            {formatTime(reservation.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {reservation.status === "upcoming" && (
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        data-testid={`cancel-reservation-${reservation.id}`}
                        className="mt-6 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        Annuler la réservation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
