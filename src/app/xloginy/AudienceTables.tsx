import { Button } from "../components/Button";
import { EmptyState, TablePagination } from "./DashboardFinances";
import { formatDate, type Dashboard } from "./dashboard-model";

export function AudienceTables({
  dashboard,
  tab,
  loading,
  onPageChange,
  onCustomer,
}: {
  dashboard: Dashboard;
  tab: "users" | "otp";
  loading: boolean;
  onPageChange: (page: number) => void;
  onCustomer: (email: string) => void;
}) {
  const users = tab === "users";
  const empty = users
    ? !dashboard.users.length
    : !dashboard.recentOtpRequests.length;
  return (
    <section
      className="overflow-hidden rounded-2xl border border-outline bg-white"
      aria-label={users ? "Users" : "OTP activity"}
    >
      <div className="px-5 py-5">
        <h2 className="font-display text-lg font-bold text-brandInk">
          {users ? "Customers" : "OTP activity"}
        </h2>
        <p className="mt-1 text-xs text-onSurfaceVariant">
          {users
            ? "All registered accounts. Open a customer’s packages to see purchase details."
            : "Recent sign-in requests, across all dates."}
        </p>
      </div>
      {empty ? (
        <EmptyState
          title={users ? "No customers yet" : "No OTP requests"}
          description={
            users
              ? "Registered customers will appear here."
              : "Sign-in activity will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-y border-outline bg-surfaceBright text-xs text-onSurfaceVariant">
              <tr>
                {(users
                  ? [
                      "Customer",
                      "Joined (UTC)",
                      "OTP requests",
                      "Latest OTP (UTC)",
                      "Packages",
                    ]
                  : ["Email", "Status", "Requested (UTC)", "Error"]
                ).map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-5 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {users
                ? dashboard.users.map((user) => (
                    <tr key={user.email}>
                      <th
                        scope="row"
                        className="px-5 py-4 font-semibold text-brandInk"
                      >
                        {user.email}
                      </th>
                      <td className="px-5 py-4 text-onSurfaceVariant">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {user.otpRequestCount}
                      </td>
                      <td className="px-5 py-4 text-onSurfaceVariant">
                        {formatDate(user.lastOtpRequestedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          size="sm"
                          variant="tint"
                          onClick={() => onCustomer(user.email)}
                        >
                          View packages
                        </Button>
                      </td>
                    </tr>
                  ))
                : dashboard.recentOtpRequests.map((event) => (
                    <tr key={event.id}>
                      <th
                        scope="row"
                        className="px-5 py-4 font-semibold text-brandInk"
                      >
                        {event.email}
                      </th>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.status === "sent" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                        >
                          {event.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-onSurfaceVariant">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="max-w-xs break-words px-5 py-4 text-onSurfaceVariant">
                        {event.errorMessage || "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePagination
        pagination={users ? dashboard.usersPagination : dashboard.otpPagination}
        loading={loading}
        onPageChange={onPageChange}
      />
    </section>
  );
}
