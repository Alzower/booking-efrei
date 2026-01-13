interface FilterProps {
  selectedDate: Date | null;
  onClose: () => void;
}

export default function Filter({ selectedDate, onClose }: FilterProps) {
  if (!selectedDate) return null;

  return (
    <div className="w-[400px] bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in">
      <div className="flex justify-between items-center p-8 border-b-2 border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800">Filtres</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transit   ion-all duration-200"
        >
          ✕
        </button>
      </div>

      <div className="p-8 overflow-y-auto flex-1">
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
          <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Lorem Ipsum
          </h3>
          <p className="text-base font-medium text-gray-800 capitalize">
            {selectedDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Lorem Ipsum
          </h3>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
        </div>

        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Lorem Ipsum
          </h3>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">
              Lorem Ipsum
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 mt-8 pt-8 border-t-2 border-gray-200">
          <button className="bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200 border-2 border-blue-600">
            Appliquer
          </button>
          <button className="bg-white text-gray-800 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200">
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
