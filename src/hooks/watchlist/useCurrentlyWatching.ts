import { create } from "zustand";

import { CategoryType, DummyType } from "@/types/item-type";
import { toast } from "@/hooks/use-toast";
import { dummyData } from "@/data";

interface CurrentlyWatchingStore {
  board: DummyType[];
  addImageToBoard: (id: number, category: CategoryType) => void;
  removeItemFromBoard: (id: number) => void;
}

const useCurrentlyWatching = create<CurrentlyWatchingStore>((set) => ({
  board: [],
  addImageToBoard: (id, category) => {
    set((state) => {
      const boardItem = dummyData.find((item) => item.id === id);

      if (!boardItem) return state;

      const updatedBoardItem = { ...boardItem, category };

      const updatedBoard = [updatedBoardItem, ...state.board];

      return { ...state, board: updatedBoard };
    });

    toast({
      description: "Added to ongoing animes",
    });
  },
  removeItemFromBoard: (id) => {
    set((state) => {
      const updatedBoard = state.board.filter((item) => item.id !== id);
      return { ...state, board: updatedBoard };
    });
  },
}));

export default useCurrentlyWatching;
