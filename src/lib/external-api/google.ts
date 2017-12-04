import 'url-search-params-polyfill';
import fetch from "node-fetch";
import { GOOGLE_TRANSLATE_API, GOOGLE_KEY, GOOGLE_TRANSLATE_TARGET_LANGUAGE } from "../config";

export async function translate(rawArticle) {
    // create header and body
    const headers = {
        'content-type': 'application/x-www-form-urlencoded'
    };
    const paramsObject: any = {
        key: GOOGLE_KEY,
        target: GOOGLE_TRANSLATE_TARGET_LANGUAGE,
        format: 'html',
        q: rawArticle
    }
    const params = new URLSearchParams(paramsObject);
    // call the api
    const fetchOption: object = {
        method: "POST",
        headers,
        body: params
    }
    const response = await fetch(GOOGLE_TRANSLATE_API, fetchOption);

    return response.json();
}
