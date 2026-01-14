import { useState, useEffect } from "react";
import { roomService } from "../services/roomService";
import { reservationService } from "../services/reservationService";
import type { Room } from "../services/roomService";

interface FilterProps {
  selectedDate: Date | null;
  onClose: () => void;
  onReservationCreated?: () => void;
}

export default function Filter({
  selectedDate,
  onClose,
  onReservationCreated,
}: FilterProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRooms();
    loadReservations();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms();
      setRooms(data);
    } catch (err) {
      console.error("Erreur lors du chargement des salles:", err);
      setError("Impossible de charger les salles");
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const data = await reservationService.getAllReservations();
      setReservations(data);
    } catch (err) {
      console.error("Erreur lors du chargement des réservations:", err);
    }
  };

  const isRoomAvailable = (
    roomId: string,
    startDateTime: Date,
    endDateTime: Date
  ): boolean => {
    if (!selectedDate) return false;

    const hasConflict = reservations.some((reservation) => {
      if (reservation.roomId !== roomId) return false;

      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      return startDateTime < reservationEnd && endDateTime > reservationStart;
    });

    return !hasConflict;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedRoom) {
      setError("Veuillez sélectionner une salle");
      return;
    }

    if (!selectedDate) {
      setError("Veuillez sélectionner une date");
      return;
    }

    if (startTime >= endTime) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }

    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(0, 0, 0, 0);
    const [startHour, startMinute] = startTime.split(":");
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(0, 0, 0, 0);
    const [endHour, endMinute] = endTime.split(":");
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    if (!isRoomAvailable(selectedRoom, startDateTime, endDateTime)) {
      setError(
        "Cette salle est déjà réservée pour ce créneau horaire. Veuillez choisir une autre salle ou un autre horaire."
      );
      return;
    }

    try {
      setSubmitting(true);

      const newReservation = await reservationService.createReservation({
        roomId: selectedRoom,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      const reservationColors = JSON.parse(
        localStorage.getItem("reservationColors") || "{}"
      );
      reservationColors[newReservation.id] = selectedColor;
      localStorage.setItem(
        "reservationColors",
        JSON.stringify(reservationColors)
      );

      setSuccess("Réservation créée avec succès!");
      setSelectedRoom("");
      setStartTime("09:00");
      setEndTime("10:00");
      setSelectedColor("#3b82f6");

      await loadReservations();

      if (onReservationCreated) {
        onReservationCreated();
      }

      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la réservation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedRoom("");
    setStartTime("09:00");
    setEndTime("10:00");
    setSelectedColor("#3b82f6");
    setSelectedEquipments([]);
    setError("");
    setSuccess("");
  };

  const handleEquipmentToggle = (equipment: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(equipment)
        ? prev.filter((eq) => eq !== equipment)
        : [...prev, equipment]
    );
  };

  const allEquipments = Array.from(
    new Set(rooms.flatMap((room) => room.equipment))
  );

  const filteredRooms =
    selectedEquipments.length === 0
      ? rooms
      : rooms.filter((room) =>
          selectedEquipments.every((eq) => room.equipment.includes(eq))
        );

  const getRoomAvailability = (roomId: string): boolean => {
    if (!selectedDate || !startTime || !endTime) return true;

    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(0, 0, 0, 0);
    const [startHour, startMinute] = startTime.split(":");
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(0, 0, 0, 0);
    const [endHour, endMinute] = endTime.split(":");
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    return isRoomAvailable(roomId, startDateTime, endDateTime);
  };

  const getRoomReservationsForDate = (roomId: string) => {
    if (!selectedDate) return [];

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return reservations.filter((reservation) => {
      if (reservation.roomId !== roomId) return false;

      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      return (
        reservationStart >= selectedDateStart &&
        reservationStart <= selectedDateEnd
      );
    });
  };

  const colors = [
    { name: "Bleu", value: "#3b82f6" },
    { name: "Vert", value: "#10b981" },
    { name: "Rouge", value: "#ef4444" },
    { name: "Orange", value: "#f59e0b" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Rose", value: "#ec4899" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Jaune", value: "#eab308" },
  ];

  if (!selectedDate) return null;

  return (
    <div className="w-[400px] bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in">
      <div className="flex justify-between items-center p-8 border-b-2 border-gray-200 shrink-0">
        <h2 className="text-2xl font-semibold text-gray-800">
          Réserver une salle
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-all duration-200"
        >
          ✕
        </button>
      </div>

      <div className="p-8 overflow-y-auto flex-1">
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
          <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Date sélectionnée
          </h3>
          <p className="text-base font-medium text-gray-800 capitalize">
            {selectedDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Chargement des salles...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {allEquipments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Filtrer par équipements
                </h3>
                <div className="space-y-2">
                  {allEquipments.map((equipment) => (
                    <label
                      key={equipment}
                      className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEquipments.includes(equipment)}
                        onChange={() => handleEquipmentToggle(equipment)}
                        className="w-4 h-4 cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{equipment}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Sélectionner une salle
                {filteredRooms.length < rooms.length && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({filteredRooms.length} sur {rooms.length})
                  </span>
                )}
              </h3>
              {filteredRooms.length === 0 ? (
                <p className="text-sm text-gray-600">
                  {rooms.length === 0
                    ? "Aucune salle disponible"
                    : "Aucune salle ne correspond aux équipements sélectionnés"}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredRooms.map((room) => {
                    const isAvailable = getRoomAvailability(room.id);
                    const roomReservations = getRoomReservationsForDate(
                      room.id
                    );
                    return (
                      <label
                        key={room.id}
                        data-testid={`room-label-${room.name
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 border-2 ${
                          !isAvailable
                            ? "border-red-200 bg-red-50 cursor-not-allowed"
                            : selectedRoom === room.id
                            ? "border-blue-600 bg-blue-50 cursor-pointer"
                            : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="room"
                          value={room.id}
                          checked={selectedRoom === room.id}
                          onChange={(e) => setSelectedRoom(e.target.value)}
                          data-testid={`room-radio-${room.id}`}
                          disabled={!isAvailable}
                          className="w-5 h-5 cursor-pointer accent-blue-600 mt-0.5 disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {room.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 block mb-1">
                            Capacité: {room.capacity} personnes
                          </span>
                          {roomReservations.length > 0 && (
                            <div className="mt-2 mb-2">
                              <span className="text-xs font-semibold text-gray-700 block mb-1">
                                Créneaux réservés aujourd'hui:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {roomReservations.map((reservation) => {
                                  const start = new Date(reservation.startTime);
                                  const end = new Date(reservation.endTime);
                                  return (
                                    <span
                                      key={reservation.id}
                                      className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded border border-orange-300"
                                    >
                                      {start.toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      -{" "}
                                      {end.toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {!isAvailable && (
                            <div className="mt-2">
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">
                                Conflit avec votre créneau
                              </span>
                            </div>
                          )}
                          {room.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.equipment.map((eq, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedRoom && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Détails de la salle sélectionnée
                </h3>
                {(() => {
                  const room = filteredRooms.find((r) => r.id === selectedRoom);
                  if (!room) return null;
                  return (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {room.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
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
                          <span>
                            Capacité: <strong>{room.capacity} personnes</strong>
                          </span>
                        </div>
                        {room.equipment.length > 0 && (
                          <div>
                            <div className="flex items-start text-gray-700 mb-2">
                              <svg
                                className="w-4 h-4 mr-2 mt-0.5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              <span>Équipements disponibles:</span>
                            </div>
                            <div className="flex flex-wrap gap-1 ml-6">
                              {room.equipment.map((eq, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white text-blue-700 text-xs rounded border border-blue-300 font-medium"
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Couleur de l'événement
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`h-8 w-8 rounded-full transition-all duration-200 ${
                      selectedColor === color.value
                        ? "border-gray-800 scale-110 shadow-md"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Horaires
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8 pt-8 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={submitting || !selectedRoom}
                data-testid="reservation-submit-button"
                className="bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200 border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? "Réservation..." : "Réserver"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="bg-white text-gray-800 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
