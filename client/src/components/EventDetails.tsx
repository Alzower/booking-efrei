import { useState } from "react";
import { reservationService } from "../services/reservationService";
import type { Reservation } from "../services/reservationService";
import type { Room } from "../services/roomService";

interface EventDetailsProps {
  reservation: Reservation | null;
  rooms: Room[];
  onClose: () => void;
  onReservationDeleted?: () => void;
}

export default function EventDetails({
  reservation,
  rooms,
  onClose,
  onReservationDeleted,
}: EventDetailsProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!reservation) return null;

  const room = rooms.find((r) => r.id === reservation.roomId);
  const startDate = new Date(reservation.startTime);
  const endDate = new Date(reservation.endTime);

  const reservationColors = JSON.parse(
    localStorage.getItem("reservationColors") || "{}"
  );

  const eventColor = reservationColors[reservation.id] || "#3b82f6";

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError("");
      await reservationService.deleteReservation(reservation.id);

      const reservationColors = JSON.parse(
        localStorage.getItem("reservationColors") || "{}"
      );
      delete reservationColors[reservation.id];
      localStorage.setItem(
        "reservationColors",
        JSON.stringify(reservationColors)
      );

      setSuccess("Réservation annulée avec succès!");

      if (onReservationDeleted) {
        onReservationDeleted();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'annulation"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-[400px] h-screen bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in">
      <div className="flex justify-between items-center p-8 border-b-2 border-gray-200 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-gray-800">
          Détails de la réservation
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-all duration-200"
        >
          ✕
        </button>
      </div>

      <div className="p-8 overflow-y-auto flex-1">
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

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Couleur
          </h3>
          <div
            className="h-12 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: eventColor }}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Salle
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              {room ? room.name : "Salle inconnue"}
            </p>
            {room && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Capacité: {room.capacity} personnes
                </p>
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
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Date et horaires
          </h3>
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="text-base font-medium text-gray-800 capitalize mb-2">
              {startDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-700">
              De{" "}
              <span className="font-semibold">
                {startDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>{" "}
              à{" "}
              <span className="font-semibold">
                {endDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Informations
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">ID:</span> {reservation.id}
            </p>
            <p>
              <span className="font-medium">Créée le:</span>{" "}
              {new Date(reservation.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8 pt-8 border-t-2 border-gray-200">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20 transition-all duration-200 border-2 border-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {deleting ? "Annulation..." : "Annuler la réservation"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="bg-white text-gray-800 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
