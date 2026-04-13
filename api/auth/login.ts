import handler from "../../netlify/functions/auth-login.mts";
import { createVercelHandler } from "../_shared/invoke-netlify";

export default createVercelHandler(handler);
