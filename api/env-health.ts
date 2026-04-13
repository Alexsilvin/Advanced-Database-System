import handler from "../netlify/functions/env-health.mts";
import { createVercelHandler } from "./_shared/invoke-netlify";

export default createVercelHandler(handler);
