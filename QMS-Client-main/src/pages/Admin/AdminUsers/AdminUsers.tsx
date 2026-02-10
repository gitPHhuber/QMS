import { useEffect, useState } from "react";
import { fetchPC, fetchSession, fetchUsers, deleteUser } from "src/api/userApi";
import { AdminOneUser } from "./AdminOneUser";
import { userGetModel } from "src/types/UserModel";
import { SessionModelFull } from "src/types/SessionModel";
import { pcModelFull } from "src/types/PCModel";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [sessions, setSessions] = useState<SessionModelFull[]>([]);
  const [pcs, setPcs] = useState<pcModelFull[]>([]);

  const updateUsersList = async () => {
    fetchUsers().then((data) => setUsers(data));
    fetchSession().then((data) => setSessions(data));
    fetchPC().then((data) => setPcs(data));
  };

  useEffect(() => {
    updateUsersList();
  }, []);

  const getActiveSession = () => {
    return sessions.filter(
      (session: SessionModelFull) => session.online === true
    );
  };

  const getUsersOnlineID = () => {
    return (

      getActiveSession().map((session: SessionModelFull) => session.userId)
    );
  };

  const isOnline = (id: number) => {
    return getUsersOnlineID().includes(id);
  };

  const getCurrentPCName = (userId: number) => {
    const currentSession = getActiveSession().find(
      (session) => session.userId === userId
    );
    const currentPC = pcs.find(
      (pc) => pc.id === currentSession?.PCId
    );

    return currentPC;
  };

  const deleteCurrentUser = async (id: number) => {
    try {
      await deleteUser(id);
      updateUsersList();
    } catch (error: any) {
      console.error("Ошибка при удалении юзера:", error);
    }
  };

  let allUsers = users.map((user: userGetModel) => (
    <AdminOneUser
      key={user.id}
      ID={user.id}
      login={user.login}
      role={user.role}
      name={user.name}
      surName={user.surname}
      img={user.img}
      active={isOnline(user.id)}
      pcName={getCurrentPCName(user.id)?.pc_name}
      pcIP={getCurrentPCName(user.id)?.ip}
      updateUsersList={() => updateUsersList()}
      deleteUser={() => deleteCurrentUser(user.id)}
    />
  ));
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
        📋 Список пользователей
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allUsers}
      </div>
    </div>
  );
};
