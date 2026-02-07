import { Request, Response } from "express";
import Event from "../models/Event";

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.getAll();
    res.json({
      data: events,
      message: "Success get all events",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.getById(Number(id));
    res.json({
      data: event,
      message: "Success get event detail",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Event.create(payload);
    res.json({
      message: "Success create event",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await Event.update(Number(id), payload);
    res.json({ message: "Success update event" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Event.delete(Number(id));
    res.json({ message: "Success delete event" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
