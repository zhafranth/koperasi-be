import db from "../../db";

class Event {
  static async getAll() {
    return await db("events")
      .select("id", "title", "description", "tanggal", "waktu", "location", "kategori", "createdAt")
      .orderBy("tanggal", "asc");
  }

  static async getById(id: number) {
    const event = await db("events").where("id", id).first();
    if (!event) {
      throw new Error("Event tidak ditemukan");
    }
    return event;
  }

  static async create(payload: any) {
    const { title, description, tanggal, waktu, location, kategori } = payload;

    if (!title?.trim()) {
      throw new Error("Judul event wajib diisi");
    }

    if (!tanggal) {
      throw new Error("Tanggal event wajib diisi");
    }

    if (!kategori) {
      throw new Error("Kategori event wajib diisi");
    }

    const [id] = await db("events").insert({
      title,
      description: description || null,
      tanggal,
      waktu: waktu || null,
      location: location || null,
      kategori,
    });

    return id;
  }

  static async update(id: number, payload: any) {
    const event = await db("events").where("id", id).first();
    if (!event) {
      throw new Error("Event tidak ditemukan");
    }

    const allowedFields = ["title", "description", "tanggal", "waktu", "location", "kategori"];
    const cleanPayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (payload[key] !== undefined) {
        cleanPayload[key] = payload[key];
      }
    }

    if (cleanPayload.title !== undefined && !cleanPayload.title?.trim()) {
      throw new Error("Judul event wajib diisi");
    }

    if (Object.keys(cleanPayload).length === 0) {
      throw new Error("Tidak ada data yang diubah");
    }

    await db("events").where("id", id).update(cleanPayload);
  }

  static async delete(id: number) {
    const event = await db("events").where("id", id).first();
    if (!event) {
      throw new Error("Event tidak ditemukan");
    }

    await db("events").where("id", id).del();
  }
}

export default Event;
