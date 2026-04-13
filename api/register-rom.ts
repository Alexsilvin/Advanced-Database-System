import handler from "../netlify/functions/register-rom.mts";
import { createVercelHandler } from "./_shared/invoke-netlify";

export default createVercelHandler(handler);
