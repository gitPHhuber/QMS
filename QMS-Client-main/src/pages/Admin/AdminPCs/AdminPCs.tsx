import { useEffect, useState } from "react";
import { deletePC, fetchPC } from "src/api/userApi";
import { AdminOnePC } from "./AdminOnePC";
import { pcModelFull } from "src/types/PCModel";

export const AdminPCs: React.FC = () => {
  const [pcs, setPcs] = useState<pcModelFull[]>([]);

  const updatePCList = async () => {
    fetchPC().then((data) => setPcs(data));
  };

  useEffect(() => {
    updatePCList();
  }, []);

  const deleteComputer = async (id: number) => {
    try {
      await deletePC(id);
      updatePCList()
    } catch (error: any) {
      console.error("Ошибка при удалении компа:", error);
    }
  };

  let PCs = pcs.map((el: pcModelFull) => (
    <AdminOnePC
      deleteComputer={() => deleteComputer(el.id)}
      updatePCList = {()=> updatePCList()}
      key={el.id}
      ID={el.id}
      PCname={el.pc_name}
      IP={el.ip}
      cabinet={el.cabinet}
    />
  ));

  return (
    <div className="p-4  bg-asvo-bg shadow-lg shadow-black/20 rounded-lg h-screen overflow-y-auto">
      <h2 className="text-xl font-bold text-asvo-text mb-4 border-b-2 pb-2">
        Список ПК
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {PCs}
      </div>
    </div>
  );
};
