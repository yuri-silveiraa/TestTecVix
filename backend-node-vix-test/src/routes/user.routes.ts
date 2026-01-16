import { Router } from "express";
import { API_VERSION, ROOT_PATH } from "../constants/basePathRoutes";
import { UserController } from "../controllers/UserController";
import { authUser } from "../auth/authUser";

const BASE_PATH = API_VERSION.V1 + ROOT_PATH.USERS;

const userRoutes = Router();
const userController = new UserController();

userRoutes.post(`${BASE_PATH}`,  (req, res) => { userController.create(req, res); });
userRoutes.post(`${BASE_PATH}/login`, (req, res) => { userController.login(req, res); });

userRoutes.get(`${BASE_PATH}`, authUser, (req, res) => { userController.list(req, res); });
userRoutes.get(`${BASE_PATH}/:idUser`, authUser, (req, res) => { userController.getById(req, res); });
userRoutes.get(`${BASE_PATH}/token/:idUser`, authUser, (req, res) => { userController.generateToken(req, res); });

userRoutes.put(`${BASE_PATH}/:idUser`, authUser, (req, res) => { userController.update(req, res); });

userRoutes.delete(`${BASE_PATH}/:idUser`, authUser, (req, res) => { userController.delete(req, res); }); 

export { userRoutes };