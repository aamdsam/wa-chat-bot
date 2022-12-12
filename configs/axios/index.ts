import axios from "axios";

const instance = axios.create({
    baseURL: process.env.API_URL,
    timeout: 3000,
    headers: {'token': process.env.API_TOKEN}
});

export default instance;
