import { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { login } from "src/api/userApi";
import { Context } from "src/main";
import { REGISTRATION_ROUTE, SELECT_PC_ROUTE } from "src/utils/consts";

export const Login: React.FC = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error("Context must be used within a Provider");
  }

  const { user } = context;

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");

  const signIN = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const currentUser = await login(loginName, password);

      user.setUser(currentUser);
      user.setIsAuth(true);

      console.log(user.user);
      setSuccessMessage("Авторизация прошла успешно");
      setErrorMessage("");
      localStorage.removeItem("pcID");
      localStorage.removeItem("sessionID");

      setTimeout(() => {
        navigate(SELECT_PC_ROUTE);
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setErrorMessage(
        `Произошла ошибка при авторизации. ${error.response.data.message}`
      );
      setSuccessMessage("");
      console.error("Ошибка при регистрации:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-asvo-dark">
      <div className="bg-asvo-dark-2 p-6 rounded-xl shadow-2xl border border-asvo-dark-3/50 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-asvo-light">
          Войти в существующий аккаунт
        </h2>
        <form>
          <div className="mb-4">
            <label className="block text-asvo-muted text-sm font-bold mb-2">
              Логин
            </label>
            <input
              className="bg-asvo-dark border border-asvo-dark-3 rounded-lg w-full py-2 px-3 text-asvo-light mb-3 leading-tight focus:outline-none focus:border-asvo-accent focus:ring-1 focus:ring-asvo-accent"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-asvo-muted text-sm font-bold mb-2"
              htmlFor="password"
            >
              Пароль
            </label>
            <input
              className="bg-asvo-dark border border-asvo-dark-3 rounded-lg w-full py-2 px-3 text-asvo-light mb-3 leading-tight focus:outline-none focus:border-asvo-accent focus:ring-1 focus:ring-asvo-accent"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={signIN}
              type="submit"
              className="bg-asvo-accent hover:bg-asvo-accent-hover text-asvo-dark font-bold py-2 px-6 rounded-lg focus:outline-none transition-colors"
            >
              Войти
            </button>

            <NavLink
              to={REGISTRATION_ROUTE}
              className="inline-block align-baseline font-bold text-sm text-asvo-accent hover:text-asvo-accent-hover"
            >
              Нет аккаунта?
            </NavLink>
          </div>
        </form>
        {successMessage && (
          <div className="mt-4 text-asvo-accent font-medium">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 text-red-400 font-medium">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};
