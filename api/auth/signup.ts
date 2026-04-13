import handler from "../../netlify/functions/auth-signup.mts";
import { createVercelHandler } from "../_shared/invoke-netlify";

export default createVercelHandler(handler);
