import Pengurus from "../models/Pengurus";

export const createPengurus = async (req: any, res: any) => {
  try {
    const data = req.body;
    await Pengurus.create(data);
    res.json({ message: "Success create pengurus" });
  } catch (error) {
    console.info(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
