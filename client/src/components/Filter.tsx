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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRooms();
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

    try {
      setSubmitting(true);

      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(0, 0, 0, 0);
      const [startHour, startMinute] = startTime.split(":");
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(0, 0, 0, 0);
      const [endHour, endMinute] = endTime.split(":");
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

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
    setError("");
    setSuccess("");
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
      <div className="flex justify-between items-center p-8 border-b-2 border-gray-200">
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
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Sélectionner une salle
              </h3>
              {rooms.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune salle disponible</p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <label
                      key={room.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer rounded-lg transition-colors duration-200 border-2 ${
                        selectedRoom === room.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="room"
                        value={room.id}
                        checked={selectedRoom === room.id}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="w-5 h-5 cursor-pointer accent-blue-600 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800 block">
                          {room.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          Capacité: {room.capacity} personnes
                        </span>
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
                  ))}
                </div>
              )}
            </div>

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
