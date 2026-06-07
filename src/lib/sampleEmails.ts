import type { ClassifierEmailInput } from "./classifier/types";

export const sampleClassifierEmails: ClassifierEmailInput[] = [
  {
    id: "sample-rbc-interview",
    from: "recruiting@rbc.com",
    subject: "Interview invitation — Financial Analyst",
    snippet:
      "We would like to schedule a call with the hiring manager. Please share your availability this week.",
    receivedAt: "2026-06-07T09:15:00",
  },
  {
    id: "sample-kpmg-assessment",
    from: "talent@kpmg.ca",
    subject: "Complete your online assessment",
    snippet:
      "Please complete the online assessment by June 10 for the Analyst role.",
    receivedAt: "2026-06-06T14:30:00",
  },
  {
    id: "sample-cgi-applied",
    from: "careers@cgi.com",
    subject: "Thank you for applying",
    snippet: "We received your application for Business Analyst at CGI.",
    receivedAt: "2026-06-04T11:00:00",
  },
  {
    id: "sample-slc-rejection",
    from: "hr@slcmanagement.com",
    subject: "Update on your application",
    snippet:
      "Unfortunately, we will not be moving forward with your application for Financial Analyst.",
    receivedAt: "2026-06-03T16:45:00",
  },
  {
    id: "sample-td-offer",
    from: "careers@td.com",
    subject: "Congratulations — Offer for Associate Analyst",
    snippet:
      "We are pleased to offer you the Associate Analyst position. Please review the employment agreement.",
    receivedAt: "2026-06-05T10:00:00",
  },
  {
    id: "sample-recruiter-followup",
    from: "recruiter@cibc.com",
    subject: "Next steps for your application",
    snippet:
      "I am following up on your application. Are you available for a quick call to discuss next steps?",
    receivedAt: "2026-06-02T13:20:00",
  },
  {
    id: "sample-linkedin-alert",
    from: "jobs@linkedin.com",
    subject: "New job alert: Financial Analyst roles",
    snippet: "We found new jobs matching your preferences in Toronto.",
    receivedAt: "2026-06-01T08:00:00",
  },
];
