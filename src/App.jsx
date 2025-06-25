import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addDays,
} from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Modal from "react-modal";
import initialEvents from "./events.json";
import "./App.css";

Modal.setAppElement('#root');

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", time: "", duration: "" });
  const [editIndex, setEditIndex] = useState(null);

  const prevMonth = () => setCurrentMonth((prev) => addMonths(prev, -1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const getEventsForDate = (date) =>
    events.filter((event) => event.date === format(date, "yyyy-MM-dd"))
      .sort((a, b) => a.time.localeCompare(b.time));

  const openModal = (date, index = null) => {
    if (index !== null) {
      const event = events[index];
      setNewEvent({ title: event.title, time: event.time, duration: event.duration });
      setEditIndex(index);
    } else {
      setNewEvent({ title: "", time: "", duration: "" });
      setEditIndex(null);
    }
    setSelectedDate(date);
    setIsModalOpen(true);
  };
  
  const saveEvent = () => {
    if (!newEvent.title || !newEvent.time) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (editIndex !== null) {
      const updated = [...events];
      updated[editIndex] = { ...newEvent, date: dateStr };
      setEvents(updated);
    } else {
      setEvents([...events, { ...newEvent, date: dateStr }]);
    }
    setIsModalOpen(false);
  };
  
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedEvent = events.filter(event => event.date === source.droppableId)[source.index];
    const updated = events.filter((event, idx) => !(event.date === source.droppableId && idx === source.index));
    draggedEvent.date = destination.droppableId;

    setEvents([...updated, draggedEvent]);
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });      // Saturday
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  return (
    <div>
      <nav className="navbar">
        <h1>My Calendar App</h1>
        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">About</a>
        </div>
      </nav>

      <div className="calendar">
        <div className="calendar-header">
          <button onClick={prevMonth}>&laquo;</button>
          <h2>{format(currentMonth, "MMMM yyyy")}</h2>
          <button onClick={nextMonth}>&raquo;</button>
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          <DragDropContext onDragEnd={onDragEnd}>
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              return (
                <Droppable droppableId={format(day, "yyyy-MM-dd")} key={day}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`calendar-day ${isSameMonth(day, currentMonth) ? "" : "other-month"} ${isToday(day) ? "today" : ""}`}
                      onDoubleClick={() => openModal(day)}
                    >
                      <div className="date">{format(day, "d")}</div>
                      <div className="events">
                        {dayEvents.map((event, index) => (
                          <Draggable
                            key={`${event.title}_${index}`}
                            draggableId={`${event.title}_${index}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`event ${dayEvents.length > 1 ? "overlap" : ""}`}
                                title={`${event.title} ${event.time} (${event.duration})`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(
                                    day,
                                    events.findIndex(
                                      (ev) =>
                                        ev.date === format(day, "yyyy-MM-dd") && ev.title === event.title && ev.time === event.time
                                    )
                                  );
                                }}
                              >
                                {event.time} - {event.title}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {dayEvents.length > 2 && (
                          <div className="notification">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </DragDropContext>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Edit Event"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>{editIndex !== null ? "Edit Event" : "Add Event"}</h2>
        <input
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <input
          placeholder="Time (e.g. 10:30)"
          value={newEvent.time}
          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
        />
        <input
          placeholder="Duration (e.g. 1h)"
          value={newEvent.duration}
          onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
        />
        <div className="modal-buttons">
          <button onClick={saveEvent}>Save</button>
          <button onClick={() => setIsModalOpen(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export default App;

