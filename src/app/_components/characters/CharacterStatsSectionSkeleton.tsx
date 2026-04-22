import { Skeleton } from "@/components/ui/skeleton";

const RealmCardSkeleton = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-md min-w-0">
    <div className="py-1 px-3 sm:px-4 rounded-t-md bg-gray-800/10">
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="px-3 sm:px-4 py-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

const CharacterStatsSectionSkeleton = () => {
  return (
    <div className="bg-gray-900 p-2 sm:p-4 w-full">
      <div className="text-center mb-2 sm:mb-3">
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
        <RealmCardSkeleton />
        <RealmCardSkeleton />
        <RealmCardSkeleton />
      </div>

      <div className="mt-2 sm:mt-3">
        <div className="bg-gray-900 border border-gray-800 rounded-md">
          <div className="flex items-center py-1 px-3 sm:px-4 rounded-t-md bg-gray-800/10">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-2.5 w-8 ml-auto" />
          </div>
          <div className="py-1 px-3 sm:px-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-3">
        <div className="bg-gray-900 border border-gray-800 rounded-md">
          <div className="bg-gray-800/10 flex items-center py-1 px-3 sm:px-4 rounded-t-md">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32 ml-auto" />
          </div>
          <div className="py-1 px-3 sm:px-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStatsSectionSkeleton;
