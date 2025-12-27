import axios, { type AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 1000*60*5, }); // timeout 5 minutes

export interface CustomAxiosConfig extends AxiosRequestConfig {
  hideMessage?: boolean;
}

const prepareErrorMessage = (message: string, errors: string[]) => {
  return errors?.reduce((msg, err) => msg + "\n* " + err, message);
};

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token"); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.withCredentials = true;

    return config;
});

api.interceptors.response.use(

    (response) => {
        const config = response.config as CustomAxiosConfig;
        const errMessage = prepareErrorMessage(response.data.message, response.data.errors);

        if (response.data.responseType === "msg" && !config.hideMessage)
            toast.success(errMessage, { style: { whiteSpace: "pre-line" }, }) ;
        else if (response.data.responseType === "warn")
            toast.warn(errMessage, { style: { whiteSpace: "pre-line" }, });
        else if (response.data.responseType === "err")
            toast.error(errMessage, { autoClose: false, style: { whiteSpace: "pre-line", width:"100%" },  });
        return response;
    },
    (err) => {
//        const errMessage = prepareErrorMessage(err.response.data.message, err.response.data.errors);
        const errMessage = prepareErrorMessage(err.response.data.message, err.response.data.data.errors);

        if (axios.isAxiosError(err)) {
            toast.error(errMessage ?? "Something went wrong", { style: { whiteSpace: "pre-line" }, });
        } else {
            toast.error("Unexpected error", { style: { whiteSpace: "pre-line" }, });
        }
        return Promise.reject(err);
    }
);