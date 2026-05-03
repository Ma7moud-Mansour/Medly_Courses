import { requireServerSession } from "@/lib/auth/server-session";
import { listStudentNotifications } from "@/lib/student/repository";

export default async function NotificationsPage() {
  const session = await requireServerSession();
  const notifications = await listStudentNotifications(session.userId);

  return (
    <div>
      <h1 className="text-3xl font-black">الإشعارات</h1>
      {notifications.length ? (
        <div className="mt-6 grid gap-3">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{notification.title}</h2>
                  <p className="mt-2 leading-8 text-muted-foreground">{notification.body}</p>
                </div>
                <span className="rounded-lg bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  {notification.read ? "مقروء" : "جديد"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm font-bold text-muted-foreground">
          لا توجد إشعارات في حسابك الآن.
        </div>
      )}
    </div>
  );
}
