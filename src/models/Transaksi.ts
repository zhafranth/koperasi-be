import dayjs from "dayjs";
import db from "../../db";

class Transaksi {
  static async getAll() {
    return await db("transaksi");
  }
}

export default Transaksi;
