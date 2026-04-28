export default function AnnouncementPage() {
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Announcement</h1>
          <p className="text-xs text-muted-foreground mt-2">
            This is the announcement page. You can view important updates and news here.
          </p>
        </div>
      </div>
    </div>
  );
}