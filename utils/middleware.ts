import { info, errorLog } from "./logger";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "../types";

const requestLogger = (request, _response, next) => {
  info("Method:", request.method);
  info("Path:  ", request.path);
  info("Body:  ", request.body);
  info("---");
  next();
};

const unknownEndpoint = (_request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, _request, response, next) => {
  errorLog(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: error.message });
  }

  next(error);
};

const tokenExtractor = (request: RequestWithUser, _response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    request.token = authorization.replace("Bearer ", "");
  }
  next();
};

const userExtractor = async (request: RequestWithUser, response, next) => {
  if (!request.token) {
    return response.status(401).json({ error: "token missing" });
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (typeof decodedToken === "object" && "id" in decodedToken) {
    request.user = await User.findById(decodedToken.id);
    next();
  } else {
    return response.status(401).json({ error: "token invalid" });
  }
};

export {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
