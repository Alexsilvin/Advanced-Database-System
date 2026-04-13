import handler from "../../netlify/functions/auth-me.mts";
import { createVercelHandler } from "../_shared/invoke-netlify";

export default createVercelHandler(handler);
