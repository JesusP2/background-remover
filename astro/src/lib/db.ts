import Dexie, { type EntityTable } from "dexie";

type Image = {
  id: string;
  name: string;
  source: Blob;
  mask: Blob;
  result: Blob;
  createdAt: number;
  updatedAt: number;
};
export const db = new Dexie("imagesDb") as Dexie & {
  images: EntityTable<Image, "id">;
};

db.version(1).stores({
  images: "id",
});
