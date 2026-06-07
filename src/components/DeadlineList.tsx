import type { DeadlineRecord } from "../lib/types";

type DeadlineListProps = {
  deadlines: DeadlineRecord[];
};

export function DeadlineList({ deadlines }: DeadlineListProps) {
  return (
    <div className="card feed-card">
      <ul className="deadline-list">
        {deadlines.map((deadline) => (
          <li key={deadline.id} className={`deadline-item urgency-${deadline.urgency}`}>
            <div>
              <strong>
                {deadline.company} — {deadline.role}
              </strong>
              <p>{deadline.label}</p>
            </div>
            <span className="deadline-date">Due {deadline.dueDate}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
