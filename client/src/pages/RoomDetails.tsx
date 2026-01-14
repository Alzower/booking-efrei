import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { roomService } from "../services/roomService";
import { reservationService } from "../services/reservationService";
import type { Room } from "../services/roomService";
import type { Reservation } from "../services/reservationService";

function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadRoomDetails();
    }
  }, [id]);

  const loadRoomDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [roomData, allReservations] = await Promise.all([
        roomService.getRoomById(id),
        reservationService.getUserReservations(),
      ]);

      setRoom(roomData);
      const roomReservations = allReservations.filter(
        (res) => res.roomId === id
      );
      setReservations(roomReservations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des détails"
      );
    } finally {
      setLoading(false);
    }
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

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {error || "Salle introuvable"}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Retour au calendrier
          </button>
        </div>
      </div>
    );
  }

  const upcomingReservations = reservations.filter(
    (res) => new Date(res.startTime) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{room.name}</h1>
            <p className="text-blue-100">
              Salle de réunion • Capacité {room.capacity} personnes
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Informations
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-3"
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
                    <div>
                      <p className="text-sm text-gray-600">Capacité maximale</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {room.capacity} personnes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">
                        Réservations à venir
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {upcomingReservations.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Équipements disponibles
                </h2>
                {room.equipment.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {room.equipment.map((eq, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun équipement spécifique</p>
                )}
              </div>
            </div>

            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Prochaines réservations
              </h2>
              {upcomingReservations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReservations.slice(0, 5).map((reservation) => {
                    const start = new Date(reservation.startTime);
                    const end = new Date(reservation.endTime);
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {start.toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {start.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Réservée
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Aucune réservation à venir pour cette salle
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Réserver cette salle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetails;
