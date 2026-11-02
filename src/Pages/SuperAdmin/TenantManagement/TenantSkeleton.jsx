function Bar({ w = "w-full", h = "h-3" }) {
  return <div className={`${w} ${h} rounded bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

export function TenantStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <Bar w="w-20" h="h-3" />
          <div className="h-2" />
          <Bar w="w-12" h="h-6" />
        </div>
      ))}
    </div>
  );
}

export function TenantRowSkeletonDesktop() {
  return (
    <tr className="hidden lg:table-row border-b border-slate-100 dark:border-slate-700/60">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <Bar w="w-32" />
            <Bar w="w-20" h="h-2" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><Bar w="w-14" h="h-5" /></td>
      <td className="px-4 py-4"><Bar w="w-16" h="h-5" /></td>
      <td className="px-4 py-4"><Bar w="w-24" /></td>
      <td className="px-4 py-4"><Bar w="w-10" /></td>
      <td className="px-4 py-4"><Bar w="w-20" /></td>
      <td className="px-4 py-4"><Bar w="w-16" /></td>
    </tr>
  );
}

export function TenantRowSkeletonMobile() {
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
        <div className="space-y-2 flex-1"><Bar w="w-2/3" /><Bar w="w-1/3" h="h-2" /></div>
      </div>
      <div className="flex gap-2"><Bar w="w-14" h="h-5" /><Bar w="w-16" h="h-5" /></div>
    </div>
  );
}