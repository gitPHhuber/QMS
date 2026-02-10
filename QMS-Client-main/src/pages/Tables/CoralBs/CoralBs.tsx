import coralB1 from "assets/images/CoralB1.png";
import coralB2 from "assets/images/CoralB2.png";
import { PagesCoralB } from "./PagesCoralB";
import { CoralBList } from "./CoralBList";

export const CoralBs: React.FC = () => {
  return (
    <div className="flex  h-screen bg-gray-100/60">

      <main className="flex-1 p-6 flex flex-col overflow-y-auto h-screen">

        <header className=" flex  mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Coral B</h1>


          <div className="flex ml-10 justify-center items-center gap-6">
            <img
              src={coralB1}
              className="w-24 h-auto rounded-lg shadow-md"
              alt="915"
            />
            <img
              src={coralB2}
              className="w-24 h-auto rounded-lg shadow-md"
              alt="915"
            />
          </div>
        </header>


        <div className="flex-1 bg-white shadow-md rounded-lg">
          <CoralBList />
        </div>


        <div className="mt-6 flex justify-center">
          <PagesCoralB />
        </div>
      </main>
    </div>
  );
};
