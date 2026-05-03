import { requireServerSession } from "@/lib/auth/server-session";
import { performStudentSupportAction } from "@/lib/support/actions";
import { getStudentSupportTicket, listStudentSupportTickets } from "@/lib/support/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default async function StudentSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireServerSession();
  const params = await searchParams;
  const selectedTicketId = first(params.ticket);
  const flash = first(params.flash);
  const tickets = await listStudentSupportTickets(session.userId);
  const selectedTicket =
    (selectedTicketId ? await getStudentSupportTicket(session.userId, selectedTicketId) : undefined) ??
    (tickets[0] ? await getStudentSupportTicket(session.userId, tickets[0].id) : undefined);

  return (
    <div className="space-y-6">
      {flash ? (
        <div className="rounded-lg border border-[#cfe3de] bg-[#eef8f5] px-4 py-3 text-sm font-black text-primary">
          Support inbox updated successfully.
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h1 className="text-3xl font-black">Support inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a ticket, follow replies from the Medly team, and keep your issue in one conversation.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <form action={performStudentSupportAction} className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <input name="intent" type="hidden" value="create-ticket" />
            <div>
              <h2 className="text-lg font-black">Open a new ticket</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose the closest issue type and include the course or payment details when relevant.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Title
              <input className="form-input" name="title" placeholder="Example: Course still locked after payment" />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Issue type
              <select className="form-input" defaultValue="general" name="issueType">
                <option value="general">General</option>
                <option value="payment">Payment</option>
                <option value="course_access">Course access</option>
                <option value="technical">Technical</option>
                <option value="permissions">Permissions</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Message
              <textarea className="form-input min-h-32 py-3" name="message" placeholder="Tell Medly support exactly what happened" />
            </label>

            <button className="min-h-10 rounded-lg bg-primary px-4 text-sm font-black text-white" type="submit">
              Send ticket
            </button>
          </form>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-lg font-black">Your tickets</h2>
            <div className="mt-4 space-y-3">
              {tickets.length ? (
                tickets.map((ticket) => (
                  <a
                    key={ticket.id}
                    className={`block rounded-lg border px-4 py-4 transition ${
                      selectedTicket?.id === ticket.id
                        ? "border-primary bg-[#eef8f5]"
                        : "border-border bg-white hover:border-primary/30"
                    }`}
                    href={`/dashboard/support?ticket=${ticket.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{ticket.title}</p>
                      {ticket.unreadForStudent ? (
                        <span className="rounded-full bg-[#f4b942] px-2 py-1 text-[10px] font-black text-[#3d3213]">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      {statusLabels[ticket.status] ?? ticket.status}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {ticket.latestMessagePreview || ticket.description}
                    </p>
                  </a>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-white p-5 text-sm font-bold text-muted-foreground">
                  You have not opened any support ticket yet.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          {selectedTicket ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black">{selectedTicket.title}</h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                  {statusLabels[selectedTicket.status] ?? selectedTicket.status}
                </span>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-white p-4">
                {selectedTicket.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-lg px-4 py-3 ${
                      message.senderRole === "student" ? "bg-[#f7fbfa]" : "bg-[#eef8f5]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-black">{message.senderName}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{message.body}</p>
                  </article>
                ))}
              </div>

              <form action={performStudentSupportAction} className="grid gap-3 rounded-lg border border-border bg-white p-4">
                <input name="intent" type="hidden" value="reply-ticket" />
                <input name="ticketId" type="hidden" value={selectedTicket.id} />
                <label className="grid gap-2 text-sm font-bold">
                  Reply
                  <textarea className="form-input min-h-28 py-3" name="message" placeholder="Add any extra detail or follow-up question" />
                </label>
                <button className="min-h-10 rounded-lg bg-primary px-4 text-sm font-black text-white" type="submit">
                  Send reply
                </button>
              </form>
            </div>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-border bg-white p-6 text-center text-sm font-bold text-muted-foreground">
              Select a ticket or open a new one to start the conversation.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
