interface Props {
  minDate: string;
  maxDate: string;
  currentDate: string;
  isPlaying: boolean;
  onDateChange: (date: string) => void;
  onTogglePlay: () => void;
}

function dateToDay(date: string, minDate: string): number {
  return Math.round(
    (new Date(date).getTime() - new Date(minDate).getTime()) / 86400000,
  );
}

function dayToDate(day: number, minDate: string): string {
  const d = new Date(minDate);
  d.setDate(d.getDate() + day);
  return d.toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TimelineSlider({
  minDate,
  maxDate,
  currentDate,
  isPlaying,
  onDateChange,
  onTogglePlay,
}: Props) {
  const totalDays = dateToDay(maxDate, minDate);
  const currentDay = dateToDay(currentDate, minDate);

  return (
    <div className="timeline-slider">
      <button
        className="timeline-play-btn"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <span className="timeline-date-label">{formatDate(minDate)}</span>
      <input
        type="range"
        className="timeline-range"
        min={0}
        max={totalDays}
        value={currentDay}
        aria-label="Timeline date selector"
        aria-valuetext={formatDate(currentDate)}
        onChange={e =>
          onDateChange(dayToDate(Number(e.target.value), minDate))
        }
      />
      <span className="timeline-date-label">{formatDate(maxDate)}</span>
      <span className="timeline-current-date">{formatDate(currentDate)}</span>
    </div>
  );
}
