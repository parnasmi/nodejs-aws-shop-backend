import { HEADERS } from "../utils/utils";

export type HEADERS_TYPE = typeof HEADERS;
export type HTTP_RESPONSE = {
    statusCode:number;
      headers: HEADERS_TYPE,
      body: string
}