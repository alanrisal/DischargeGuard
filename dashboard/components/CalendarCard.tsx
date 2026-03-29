"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarCard() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  // Determine days to render
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOff = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  
  // Prev month padding
  for (let i = 0; i < startDayOff; i++) {
    cells.push({ day: daysInPrevMonth - startDayOff + i + 1, type: "prev" });
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
    // Mock event on the 15th
    const hasEvent = i === 15;
    const isSelected = i === 15 && (!isToday); // just highlight the event date if not today
    cells.push({ day: i, type: "current", isToday, isSelected, hasEvent });
  }

  // Next month padding (finish the 42 cells, i.e., 6 rows of 7)
  const remainingCells = 42 - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({ day: i, type: "next" });
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 20,
      border: "none",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      flex: 1,
      padding: 16,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", fontFamily: "'Inter', sans-serif" }}>
          {monthNames[month]} {year}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handlePrev} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.8)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <ChevronLeft size={14} color="#374151" />
          </button>
          <button onClick={handleNext} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.8)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <ChevronRight size={14} color="#374151" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "'Inter', sans-serif",
        textAlign: "center", marginBottom: 8,
      }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Dates Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2,
        flex: 1, paddingBottom: 16,
      }}>
        {cells.map((cell, idx) => {
          let bg = "transparent";
          let color = "#374151";
          let fw = 500;

          if (cell.type !== "current") {
            color = "#d1d5db";
          } else if (cell.isToday) {
            bg = "#0d9488";
            color = "#ffffff";
            fw = 700;
          } else if (cell.isSelected) {
            bg = "#1a1a2e";
            color = "#ffffff";
            fw = 700;
          }

          return (
            <div key={idx} style={{
              width: 32, height: 32, borderRadius: "50%", margin: "0 auto",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: bg, color, fontWeight: fw, fontSize: 13, fontFamily: "'Inter', sans-serif",
              cursor: "pointer", position: "relative",
              transition: "background 0.2s",
            }} className="calendar-cell">
              {cell.day}
              {cell.hasEvent && !cell.isToday && !cell.isSelected && (
                <div style={{ position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: "50%", background: "#0d9488" }} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar-cell:hover {
          background: rgba(13,148,136,0.1) !important;
          color: #0d9488 !important;
        }
      `}</style>
    </div>
  );
}
