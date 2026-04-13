import handler from "../netlify/functions/games.mts";
import { createVercelHandler } from "./_shared/invoke-netlify";

export default createVercelHandler(handler);
