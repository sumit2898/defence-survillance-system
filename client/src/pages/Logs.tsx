import { Layout } from "@/components/Layout";
import { useLogs } from "@/hooks/use-logs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Logs() {
  const { data: logs } = useLogs();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-1">Complete audit trail of system activities</p>
      </div>

      <div className="bg-card border border-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase font-mono text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-medium tracking-wider">Level</th>
                <th className="px-6 py-4 font-medium tracking-wider">Action</th>
                <th className="px-6 py-4 font-medium tracking-wider">User/System</th>
                <th className="px-6 py-4 font-medium tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-zinc-500 whitespace-nowrap">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      log.level === 'error' ? "bg-red-500/10 text-red-500" :
                      log.level === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
                      log.level === 'success' ? "bg-green-500/10 text-green-500" :
                      "bg-white/5 text-zinc-400"
                    )}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
