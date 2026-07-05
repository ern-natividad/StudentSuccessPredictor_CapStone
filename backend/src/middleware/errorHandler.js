export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Not found" });
};

// Central error handler. Logs full details server-side, but only ever
// returns generic messages for unexpected (5xx) failures to the client.
export const errorHandler = (err, req, res, _next) => {
  console.error("[error]", err);
  const status = err.status || 500;
  const message = status === 500 ? "Something went wrong. Please try again." : err.message;
  res.status(status).json({ error: message });
};
