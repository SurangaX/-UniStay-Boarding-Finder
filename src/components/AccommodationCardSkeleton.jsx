export default function AccommodationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="relative h-48 bg-slate-200 dark:bg-slate-700">
        <div className="absolute top-3 right-3 w-20 h-6 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        <div className="absolute bottom-3 left-3 w-32 h-6 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2.5">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-3/5"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4"></div>
          </div>
          
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2 mb-3"></div>

          {/* Chips */}
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
          <div className="h-9 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
