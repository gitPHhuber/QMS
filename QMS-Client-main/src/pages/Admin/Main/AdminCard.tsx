import { NavLink } from "react-router-dom";

type AdminCardProps = {
  image: string | React.ReactNode;
  title: string;
  description: string;
  onAdd?: () => void;
  editLink: string;
};

export const AdminCard = ({
  image,
  title,
  description,
  onAdd,
  editLink,
}: AdminCardProps) => (
  <div className="bg-asvo-card p-6 rounded-lg shadow-lg shadow-black/20 hover:shadow-lg transition-shadow cursor-pointer">
    <div className="flex items-center gap-4">
      {typeof image === "string" ? (
        <img src={image} alt={title} className="w-12 h-12" />
      ) : (
        image
      )}
      <div>
        <h3 className="text-lg font-semibold text-asvo-text">{title}</h3>
        <p className="text-sm text-asvo-text-mid">{description}</p>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      {onAdd && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          onClick={onAdd}
        >
          Добавить
        </button>
      )}
      <NavLink
        to={editLink}
        className="bg-asvo-grey text-asvo-text px-4 py-2 rounded-md hover:bg-asvo-grey transition"
      >
        Редактировать
      </NavLink>
    </div>
  </div>
);
