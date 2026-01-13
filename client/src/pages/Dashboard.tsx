import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Header from "../components/Header";
import Filter from "../components/Filter";
import EventDetails from "../components/EventDetails";
import { reservationService } from "../services/reservationService";
import { roomService } from "../services/roomService";
import type { Reservation } from "../services/reservationService";
import type { Room } from "../services/roomService";
import "./Dashboard.css";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
      setReservations(reservationsData);
      setRooms(roomsData);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info: { date: Date }) => {
    setSelectedDate(info.date);
    setSelectedReservation(null);
  };

  const handleEventClick = (info: any) => {
    const reservation = reservations.find((r) => r.id === info.event.id);
    if (reservation) {
      setSelectedReservation(reservation);
      setSelectedDate(null);
    }
  };

  const handleReservationCreated = () => {
    loadData();
  };

  const handleReservationDeleted = () => {
    loadData();
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : "Salle inconnue";
  };

  const events = reservations.map((reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);

    const reservationColors = JSON.parse(
      localStorage.getItem("reservationColors") || "{}"
    );

    const backgroundColor = reservationColors[reservation.id] || "#3b82f6";

    const borderColor =
      backgroundColor === "#3b82f6" ? "#2563eb" : backgroundColor;

    return {
      id: reservation.id,
      title: getRoomName(reservation.roomId),
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      textColor: "#ffffff",
      color: backgroundColor, // Propriété principale pour FullCalendar
    };
  });

  return (
    <div className="dashboard-container">
      <Header />
      <div className="calendar-content">
        <div className="calendar-wrapper">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-lg">
                Chargement du calendrier...
              </p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay",
              }}
              height="100%"
              locale="fr"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              selectable={true}
              events={events}
              eventContent={(eventInfo) => {
                const start = new Date(eventInfo.event.start!);
                const end = new Date(eventInfo.event.end!);
                const startTime = start.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTime = end.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div className="p-1">
                    <div className="font-semibold text-xs">
                      {eventInfo.event.title}
                    </div>
                    <div className="text-xs">
                      {startTime} - {endTime}
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
        <Filter
          selectedDate={selectedDate}
          onClose={() => setSelectedDate(null)}
          onReservationCreated={handleReservationCreated}
        />
        <EventDetails
          reservation={selectedReservation}
          rooms={rooms}
          onClose={() => setSelectedReservation(null)}
          onReservationDeleted={handleReservationDeleted}
        />
      </div>
    </div>
  );
}
