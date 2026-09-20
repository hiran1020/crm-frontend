interface ComingSoonProps {
  moduleName: string
  milestone: string
}

export function ComingSoon({ moduleName, milestone }: ComingSoonProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white px-6 text-center">
      <h2 className="text-xl font-semibold text-slate-900">{moduleName}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        This module is planned for {milestone}. The navigation and route are in
        place so we can build it incrementally without restructuring the app.
      </p>
    </div>
  )
}
