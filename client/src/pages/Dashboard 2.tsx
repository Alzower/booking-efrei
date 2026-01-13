import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Header from "../components/Header";
import Filter from "../components/Filter";
import "./Dashboard.css";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateClick = (info: { date: Date }) => {
    setSelectedDate(info.date);
  };

  return (
    <div className="dashboard-container">
      <Header />
      <div className="calendar-content">
        <div className="calendar-wrapper">
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
            selectable={true}
          />
        </div>
        <Filter
          selectedDate={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
}
