import db from "../../db";

class Pengurus {
  static async create(data: any) {
    try {
      await db("pengurus").insert(data);
    } catch (error) {
      throw error;
    }
  }
}

export default Pengurus;
