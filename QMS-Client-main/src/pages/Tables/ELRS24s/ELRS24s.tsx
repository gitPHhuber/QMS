import plata24_1 from "assets/images/24v1.png";
import plata24_2 from "assets/images/24v2png.png";
import { PagesELRS } from "../ELRS915s/PagesELRS";
import { Elrs24List } from "./Elrs24List";

export const ELRS24s: React.FC = () => {
  return (
    <div className="flex  h-screen bg-gray-100/60">

      <main className="flex-1 p-6 flex flex-col overflow-y-auto h-screen">

        <header className=" flex  mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            ELRS приемник 24
          </h1>


          <div className="flex ml-10 justify-center items-center gap-6">
            <img
              src={plata24_1}
              className="w-24 h-auto rounded-lg shadow-md"
              alt="24"
            />
            <img
              src={plata24_2}
              className="w-24 h-auto rounded-lg shadow-md"
              alt="24"
            />
          </div>
        </header>


        <div className="flex-1 bg-white shadow-md rounded-lg">
          <Elrs24List />
        </div>


        <div className="mt-6 flex justify-center">
          <PagesELRS />
        </div>
      </main>
    </div>
  );
};
